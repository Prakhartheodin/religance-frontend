"use client";

import { SaveToContactModal } from "@/shared/crm/save-to-contact/save-to-contact-modal";
import { useCrm } from "@/shared/crm/store/crm-context";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import SimpleBar from "simplebar-react";
import { getCompanyProfileDetail } from "./company-profile-data";
import LeadScoreBadge from "./lead-score-badge";
import type { DiscoveredCompany } from "./types";

type TabId =
  | "overview"
  | "products"
  | "contacts"
  | "certifications"
  | "source-proof"
  | "ai-notes";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "contacts", label: "Contacts" },
  { id: "certifications", label: "Certifications" },
  { id: "source-proof", label: "Source Proof" },
  { id: "ai-notes", label: "AI Notes" },
];

type CompanyProfileDrawerProps = {
  company: DiscoveredCompany | null;
  onClose: () => void;
};

export function CompanyProfileDrawer({
  company,
  onClose,
}: CompanyProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [saveOpen, setSaveOpen] = useState(false);
  const { findCompanyByDiscoveryId, leads } = useCrm();
  const open = company !== null;
  const profile = company ? getCompanyProfileDetail(company) : null;
  const existingCompany = company
    ? findCompanyByDiscoveryId(company.id)
    : undefined;
  const existingLead = company
    ? leads.find((l) => l.discoveryCompanyId === company.id)
    : undefined;

  useEffect(() => {
    if (open) {
      setActiveTab("overview");
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!profile) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-[140] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        id="lead-discovery-company-profile"
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-profile-title"
        className={`ti-offcanvas ti-offcanvas-right !max-w-[32rem] z-[150] ${
          open ? "open" : ""
        }`}
      >
        <div className="ti-offcanvas-header">
          <div className="min-w-0 flex-1 pe-3">
            <h5
              id="company-profile-title"
              className="ti-offcanvas-title !text-[1.125rem] truncate"
            >
              {profile.companyName}
            </h5>
            <p className="text-[0.75rem] text-textmuted dark:text-textmuted/90 mb-0 truncate">
              {profile.companyType} · {profile.location}
            </p>
          </div>
          <LeadScoreBadge score={profile.leadScore} />
          <button
            type="button"
            className="ti-btn flex-shrink-0 p-0 ms-2 transition-none text-defaulttextcolor dark:text-defaulttextcolor/70 hover:text-gray-700 dark:hover:text-white/80"
            onClick={onClose}
            aria-label="Close company profile"
          >
            <i className="ri-close-circle-line leading-none text-lg"></i>
          </button>
        </div>

        <div className="border-b border-defaultborder dark:border-defaultborder/10 px-2">
          <div
            className="flex flex-wrap gap-0"
            role="tablist"
            aria-label="Company profile sections"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`!py-2 !px-3 text-[0.75rem] font-medium border-0 rounded-none -mb-px ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-defaulttextcolor dark:text-defaulttextcolor/70 hover:text-primary"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <SimpleBar className="ti-offcanvas-body !pb-28">
          {activeTab === "overview" && (
            <div className="py-4 space-y-4" role="tabpanel">
              <section>
                <h6 className="text-[0.8125rem] font-semibold mb-2">Overview</h6>
                <p className="text-[0.875rem] text-defaulttextcolor mb-0">
                  {profile.overview}
                </p>
              </section>
              <section>
                <h6 className="text-[0.8125rem] font-semibold mb-2">
                  Matched salt & medicine
                </h6>
                <ul className="list-none mb-0 space-y-1 text-[0.875rem]">
                  <li>
                    <span className="text-textmuted">Salt:</span>{" "}
                    {profile.matchedSalt}
                  </li>
                  <li>
                    <span className="text-textmuted">Medicine:</span>{" "}
                    {profile.matchedMedicine}
                  </li>
                  <li>
                    <span className="text-textmuted">Dosage form:</span>{" "}
                    {profile.dosageForm}
                  </li>
                  <li>
                    <span className="text-textmuted">Category:</span>{" "}
                    {profile.category}
                  </li>
                </ul>
              </section>
              <section>
                <h6 className="text-[0.8125rem] font-semibold mb-2">Website</h6>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.875rem] text-primary break-all"
                >
                  {profile.website}
                </a>
              </section>
              <section>
                <h6 className="text-[0.8125rem] font-semibold mb-2">
                  AI summary
                </h6>
                <p className="text-[0.875rem] mb-0 rounded-md bg-light dark:bg-black/20 p-3 border border-defaultborder dark:border-defaultborder/10">
                  {profile.aiSummary}
                </p>
              </section>
              {profile.matchReasons.length > 0 && (
                <section>
                  <h6 className="text-[0.8125rem] font-semibold mb-2">
                    Match reasons
                  </h6>
                  <ul className="list-disc ps-4 mb-0 text-[0.875rem] space-y-1">
                    {profile.matchReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div className="py-4" role="tabpanel">
              <h6 className="text-[0.8125rem] font-semibold mb-3">
                Matched products
              </h6>
              <ul className="ti-list-group mb-0">
                {profile.matchedProducts.map((product) => (
                  <li
                    key={product}
                    className="ti-list-group-item border border-defaultborder dark:border-defaultborder/10"
                  >
                    <span className="text-[0.875rem]">{product}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="py-4 space-y-3" role="tabpanel">
              {profile.contacts.map((contact) => (
                <div
                  key={`${contact.name}-${contact.role}`}
                  className="border border-defaultborder dark:border-defaultborder/10 rounded-md p-3"
                >
                  <div className="font-semibold text-[0.875rem]">
                    {contact.name}
                  </div>
                  <div className="text-[0.75rem] text-textmuted mb-2">
                    {contact.role}
                  </div>
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-[0.8125rem] text-primary block"
                    >
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <span className="text-[0.8125rem] text-defaulttextcolor">
                      {contact.phone}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "certifications" && (
            <div className="py-4" role="tabpanel">
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.certificationDetails.map((cert) => (
                  <span
                    key={cert}
                    className="badge bg-success/10 text-success"
                  >
                    {cert}
                  </span>
                ))}
              </div>
              <p className="text-[0.8125rem] text-textmuted mb-0">
                Primary certification on record:{" "}
                <strong>{profile.certification}</strong>
              </p>
            </div>
          )}

          {activeTab === "source-proof" && (
            <div className="py-4 space-y-3" role="tabpanel">
              {profile.sourceLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-3 border border-defaultborder dark:border-defaultborder/10 rounded-md hover:bg-light dark:hover:bg-black/20"
                >
                  <i className="ri-external-link-line text-primary mt-0.5"></i>
                  <span>
                    <span className="block text-[0.875rem] font-medium text-defaulttextcolor">
                      {link.label}
                    </span>
                    <span className="text-[0.75rem] text-textmuted break-all">
                      {link.url}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          )}

          {activeTab === "ai-notes" && (
            <div className="py-4" role="tabpanel">
              <p className="text-[0.875rem] mb-0 rounded-md bg-primary/5 border border-primary/20 p-3">
                {profile.aiNotes}
              </p>
            </div>
          )}
        </SimpleBar>

        {(existingCompany || existingLead) && (
          <div className="px-4 py-2 border-t border-defaultborder dark:border-defaultborder/10 bg-light/40 text-[0.75rem]">
            {existingCompany && (
              <span className="me-2">
                <i className="ri-building-2-line text-success"></i> Saved to CRM
              </span>
            )}
            {existingLead && (
              <Link
                href={`/active-leads?lead=${existingLead.id}`}
                className="text-primary"
                onClick={onClose}
              >
                <i className="ri-target-lock-line"></i> View active lead
              </Link>
            )}
          </div>
        )}

        <div className="ti-offcanvas-footer flex gap-2">
          <button
            type="button"
            className="ti-btn ti-btn-primary flex-1"
            onClick={() => setSaveOpen(true)}
          >
            <i className="ri-user-add-line me-1"></i>
            Save to Contact
          </button>
          <button
            type="button"
            className="ti-btn ti-btn-light"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </aside>

      <SaveToContactModal
        profile={saveOpen ? profile : null}
        onClose={() => setSaveOpen(false)}
      />
    </>
  );
}
