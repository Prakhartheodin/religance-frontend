"use client";

import { getCompaniesForMedicine, getMedicinesForCheckedSalts, type DiscoveryMedicine } from "@/shared/crm/lead-discovery/discovery-catalog";
import { formatBuyerSubtitle } from "@/shared/crm/lead-discovery/discovery-excel";
import { listBackendMasterData } from "@/shared/crm/store/outlook-api";
import type { BackendBuyerMaster } from "@/shared/crm/store/outlook-api";
import { isAuthed } from "@/shared/auth/auth-client";
import { CompanyProfileDrawer } from "@/shared/crm/lead-discovery/company-profile-drawer";
import LeadScoreBadge from "@/shared/crm/lead-discovery/lead-score-badge";
import MedicinesTablePanel from "@/shared/crm/lead-discovery/medicines-table-panel";
import SaltsTablePanel from "@/shared/crm/lead-discovery/salts-table-panel";
import type { DiscoveredCompany } from "@/shared/crm/lead-discovery/types";
import { useCrm } from "@/shared/crm/store/crm-context";
import { useEffect, useMemo, useState } from "react";

const PANEL_SCROLL_MAX = "calc(100vh - 11rem)";

function EmptyPanel({
  icon,
  message,
}: {
  icon: string;
  message: string;
}) {
  return (
    <div className="text-center py-8 px-4">
      <span className="avatar avatar-lg bg-primary/10 text-primary mb-3 inline-flex justify-center items-center">
        <i className={`${icon} text-2xl`}></i>
      </span>
      <p className="text-textmuted dark:text-textmuted/90 mb-0 text-[0.8125rem]">
        {message}
      </p>
    </div>
  );
}

export default function LeadDiscoveryBoard() {
  const { salts, medicines: allMedicines, masterDataSynced } = useCrm();
  const [catalogueBuyers, setCatalogueBuyers] = useState<BackendBuyerMaster[]>([]);
  const [buyersLoading, setBuyersLoading] = useState(true);
  const [buyersError, setBuyersError] = useState<string | null>(null);
  const [checkedSaltIds, setCheckedSaltIds] = useState<string[]>([]);
  const [checkedMedicineIds, setCheckedMedicineIds] = useState<string[]>([]);
  const [activeMedicineId, setActiveMedicineId] = useState<string | null>(null);
  const [profileCompany, setProfileCompany] =
    useState<DiscoveredCompany | null>(null);

  const medicines = useMemo(
    () => getMedicinesForCheckedSalts(checkedSaltIds, allMedicines),
    [checkedSaltIds, allMedicines]
  );

  const activeMedicine = useMemo(
    () => medicines.find((m) => m.id === activeMedicineId) ?? null,
    [medicines, activeMedicineId]
  );

  const companies = useMemo(() => {
    if (!activeMedicine) return [];
    const salt = salts.find((s) => s.id === activeMedicine.saltId);
    if (!salt) return [];
    return getCompaniesForMedicine(activeMedicine, salt.name, catalogueBuyers);
  }, [activeMedicine, salts, catalogueBuyers]);

  useEffect(() => {
    if (!isAuthed()) {
      setCatalogueBuyers([]);
      setBuyersError("Sign in to load buyers.");
      setBuyersLoading(false);
      return;
    }

    let active = true;
    setBuyersLoading(true);
    setBuyersError(null);
    void listBackendMasterData(true).then((res) => {
      if (!active) return;
      if (res.live) {
        setCatalogueBuyers(res.data.buyers);
        setBuyersError(null);
      } else {
        setCatalogueBuyers([]);
        setBuyersError(res.error);
      }
      setBuyersLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  /** When salts change, select all linked medicines by default. */
  useEffect(() => {
    const list = getMedicinesForCheckedSalts(checkedSaltIds, allMedicines);
    const allIds = list.map((m) => m.id);
    setCheckedMedicineIds(allIds);
    setActiveMedicineId((prev) =>
      prev && allIds.includes(prev) ? prev : allIds[0] ?? null
    );
    setProfileCompany(null);
  }, [checkedSaltIds, allMedicines]);

  const handleMedicineSelectionChange = () => {
    setProfileCompany(null);
  };

  const handleActiveMedicineChange = (medicine: DiscoveryMedicine | null) => {
    setActiveMedicineId(medicine?.id ?? null);
    setProfileCompany(null);
  };

  return (
    <>
      <div className="lead-discovery-board grid grid-cols-12 gap-0 border border-defaultborder dark:border-defaultborder/10 rounded-md bg-white dark:bg-bodybg">
        {/* Salts */}
        <div className="xxl:col-span-2 xl:col-span-4 col-span-12 min-w-0 border-e border-defaultborder dark:border-defaultborder/10">
          <div className="mb-0 h-full min-w-0">
            <SaltsTablePanel
              checkedSaltIds={checkedSaltIds}
              onCheckedChange={setCheckedSaltIds}
            />
          </div>
        </div>

        {/* Medicines */}
        <div className="xxl:col-span-2 xl:col-span-4 col-span-12 min-w-0 border-e border-defaultborder dark:border-defaultborder/10">
          <div className="mb-0 h-full min-w-0">
            <MedicinesTablePanel
              checkedSaltIds={checkedSaltIds}
              checkedMedicineIds={checkedMedicineIds}
              onCheckedChange={setCheckedMedicineIds}
              activeMedicineId={activeMedicineId}
              onActiveMedicineChange={handleActiveMedicineChange}
              onSelectionChange={handleMedicineSelectionChange}
            />
          </div>
        </div>

        {/* Companies / buyers — full width below xl so table has room */}
        <div className="xxl:col-span-8 xl:col-span-12 col-span-12 min-w-0">
          <div className="box custom-box mb-0 border-0 shadow-none rounded-none h-full flex flex-col min-h-[calc(100vh-10rem)] min-w-0 xxl:rounded-se-md xl:rounded-b-md">
            <div className="box-header border-b border-defaultborder dark:border-defaultborder/10">
              <div className="box-title mb-0">
                Results
                {activeMedicine && (
                  <span className="text-textmuted dark:text-textmuted/90 font-normal text-[0.8125rem] ms-1">
                    · {companies.length} buyers
                    {companies.length > 0 && catalogueBuyers.length > 0
                      ? " (catalogue)"
                      : ""}
                  </span>
                )}
              </div>
               {buyersError ? (
                 <span className="text-[0.75rem] text-danger">{buyersError}</span>
               ) : buyersLoading ? (
                 <span className="text-[0.75rem] text-textmuted">Loading buyers…</span>
                ) : catalogueBuyers.length > 0 ? (
                  <span className="text-[0.75rem] text-success">
                    Live · {catalogueBuyers.length} buyers from catalogue
                  </span>
               ) : !masterDataSynced ? (
                 <span className="text-[0.75rem] text-textmuted">
                   Syncing salts & medicines…
                 </span>
               ) : null}
            </div>
            <div className="box-body p-0 flex-1 min-h-0 min-w-0">
              <div
                className="lead-discovery-results-panel"
                style={{ maxHeight: PANEL_SCROLL_MAX }}
              >
                {!activeMedicine ? (
                  <EmptyPanel
                    icon="ri-building-2-line"
                    message="Select a medicine to view matching companies"
                  />
                ) : companies.length === 0 ? (
                  <EmptyPanel
                    icon="ri-search-line"
                    message={
                      buyersLoading
                        ? "Loading buyers from Excel…"
                        : buyersError
                          ? `Could not load buyers: ${buyersError}`
                          : catalogueBuyers.length === 0
                            ? "No buyer data loaded. Sign in and ensure the backend can read the Excel folder."
                            : "No buyers found for this salt in the Excel master data."
                    }
                  />
                ) : (
                  <div className="table-responsive lead-discovery-results">
                    <table className="table table-hover ti-custom-table mb-0 w-full">
                      <thead className="ti-custom-table-head sticky top-0 z-[1] bg-white dark:bg-bodybg">
                        <tr>
                          <th scope="col" className="!text-start">
                            Company
                          </th>
                          <th scope="col" className="!text-start">
                            Type
                          </th>
                          <th scope="col" className="!text-start">
                            Location
                          </th>
                          <th scope="col" className="!text-end">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies.map((company: DiscoveredCompany) => {
                          const isSelected =
                            profileCompany?.id === company.id;
                          return (
                            <tr
                              key={company.id}
                              className={isSelected ? "table-active" : ""}
                            >
                              <td className="min-w-0">
                                <button
                                  type="button"
                                  className="font-semibold text-defaulttextcolor text-start hover:text-primary p-0 border-0 bg-transparent block max-w-full truncate"
                                  title={company.companyName}
                                  onClick={() => setProfileCompany(company)}
                                >
                                  {company.companyName}
                                </button>
                                <div
                                  className="text-[0.75rem] text-textmuted dark:text-textmuted/90 truncate"
                                  title={formatBuyerSubtitle(company)}
                                >
                                  {formatBuyerSubtitle(company)}
                                </div>
                              </td>
                              <td>
                                <span
                                  className="badge bg-light text-defaulttextcolor max-w-full truncate inline-block"
                                  title={company.companyType}
                                >
                                  {company.companyType}
                                </span>
                              </td>
                              <td
                                className="text-[0.8125rem] truncate"
                                title={company.location}
                              >
                                {company.location}
                              </td>
                              <td className="text-end whitespace-nowrap">
                                <LeadScoreBadge score={company.leadScore} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CompanyProfileDrawer
        company={profileCompany}
        onClose={() => setProfileCompany(null)}
      />
    </>
  );
}
