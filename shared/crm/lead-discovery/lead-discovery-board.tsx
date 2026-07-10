"use client";

import {
  getCompaniesForMedicine,
  getMedicinesForCheckedSalts,
  type DiscoveryMedicine,
} from "@/shared/crm/lead-discovery/discovery-catalog";
import { CompanyProfileDrawer } from "@/shared/crm/lead-discovery/company-profile-drawer";
import LeadScoreBadge from "@/shared/crm/lead-discovery/lead-score-badge";
import MedicinesTablePanel from "@/shared/crm/lead-discovery/medicines-table-panel";
import SaltsTablePanel from "@/shared/crm/lead-discovery/salts-table-panel";
import type { DiscoveredCompany } from "@/shared/crm/lead-discovery/types";
import { useCrm } from "@/shared/crm/store/crm-context";
import { useEffect, useMemo, useState } from "react";
import SimpleBar from "simplebar-react";

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

function truncateSalt(name: string, max = 14) {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

export default function LeadDiscoveryBoard() {
  const { salts, medicines: allMedicines } = useCrm();
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
    return getCompaniesForMedicine(activeMedicine, salt.name);
  }, [activeMedicine, salts]);

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
      <div className="grid grid-cols-12 gap-0 border border-defaultborder dark:border-defaultborder/10 rounded-md overflow-hidden bg-white dark:bg-bodybg">
        {/* Salts */}
        <div className="xxl:col-span-3 lg:col-span-4 col-span-12 min-w-0 overflow-hidden border-e border-defaultborder dark:border-defaultborder/10">
          <div className="mb-0 h-full min-w-0">
            <SaltsTablePanel
              checkedSaltIds={checkedSaltIds}
              onCheckedChange={setCheckedSaltIds}
            />
          </div>
        </div>

        {/* Medicines */}
        <div className="xxl:col-span-3 lg:col-span-4 col-span-12 min-w-0 overflow-hidden border-e border-defaultborder dark:border-defaultborder/10">
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

        {/* Companies */}
        <div className="xxl:col-span-6 lg:col-span-4 col-span-12">
          <div className="box custom-box mb-0 border-0 shadow-none rounded-none h-full flex flex-col min-h-[calc(100vh-10rem)]">
            <div className="box-header border-b border-defaultborder dark:border-defaultborder/10">
              <div className="box-title mb-0">
                Results
                {activeMedicine && (
                  <span className="text-textmuted dark:text-textmuted/90 font-normal text-[0.8125rem] ms-1">
                    · {companies.length} companies
                  </span>
                )}
              </div>
            </div>
            <div className="box-body p-0 flex-1 min-h-0">
              <SimpleBar style={{ maxHeight: PANEL_SCROLL_MAX }}>
                {!activeMedicine ? (
                  <EmptyPanel
                    icon="ri-building-2-line"
                    message="Select a medicine to view matching companies"
                  />
                ) : companies.length === 0 ? (
                  <EmptyPanel
                    icon="ri-search-line"
                    message="No companies found for this medicine"
                  />
                ) : (
                  <div className="table-responsive lead-discovery-results">
                    <table className="table table-hover whitespace-nowrap ti-custom-table min-w-full mb-0">
                      <thead className="ti-custom-table-head sticky top-0 z-[1]">
                        <tr>
                          <th scope="col">Company</th>
                          <th scope="col">Type</th>
                          <th scope="col">Location</th>
                          <th scope="col">Score</th>
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
                              <td>
                                <button
                                  type="button"
                                  className="font-semibold text-defaulttextcolor text-start hover:text-primary p-0 border-0 bg-transparent"
                                  onClick={() => setProfileCompany(company)}
                                >
                                  {company.companyName}
                                </button>
                                <div className="text-[0.75rem] text-textmuted dark:text-textmuted/90 truncate max-w-[220px]">
                                  {truncateSalt(company.matchedSalt)} ·{" "}
                                  {company.matchedMedicine}
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-light text-defaulttextcolor">
                                  {company.companyType}
                                </span>
                              </td>
                              <td className="text-[0.8125rem]">
                                {company.location}
                              </td>
                              <td>
                                <LeadScoreBadge score={company.leadScore} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </SimpleBar>
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
