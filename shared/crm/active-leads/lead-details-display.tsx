"use client";

import LeadStageBadge from "@/shared/crm/active-leads/lead-stage-badge";
import { FollowUpDateCell } from "@/shared/crm/active-leads/follow-up-date-cell";
import { QUAL_SCORE_MAX } from "@/shared/crm/active-leads/lead-form-constants";
import LeadScoreBadge from "@/shared/crm/lead-discovery/lead-score-badge";
import { formatCrmDate } from "@/shared/crm/inbox/inbox-utils";
import type {
  CrmCompany,
  CrmContact,
  CrmLead,
} from "@/shared/crm/store/types";
import type { DiscoveryMedicine } from "@/shared/crm/store/medicines-master";
import Link from "next/link";
import type { ReactNode } from "react";

/** Empty values render as em dash — matches samples register / form conventions. */
export const leadDetailDash = (v: string | null | undefined) =>
  v?.trim() ? v : "—";

export type LeadDetailsDisplayProps = {
  lead: CrmLead;
  company?: CrmCompany | null;
  contact?: CrmContact | null;
  medicines?: DiscoveryMedicine[];
  /** Show lead ID + date added row (edit form shows these at top). */
  showMeta?: boolean;
  /** Link to filter active leads by company. */
  showCompanyLink?: boolean;
};

function DetailField({
  label,
  value,
  children,
  className = "col-span-12 md:col-span-4",
}: {
  label: string;
  value?: string | number | null;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${className} min-w-0`}>
      <span className="text-[0.7rem] text-textmuted block mb-0.5">{label}</span>
      <div className="text-[0.875rem] font-medium min-w-0 break-words [overflow-wrap:anywhere]">
        {children ??
          (typeof value === "number"
            ? String(value)
            : leadDetailDash(value ?? undefined))}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="active-leads-info-card">
      <h6 className="text-[0.75rem] font-semibold text-textmuted uppercase tracking-wide mb-3">
        {title}
      </h6>
      {children}
    </div>
  );
}

function resolveMedicineInterestNames(
  lead: CrmLead,
  medicines: DiscoveryMedicine[]
): string[] {
  const ids =
    (lead.medicineIds?.length ?? 0) > 0
      ? lead.medicineIds!
      : lead.medicineId
        ? [lead.medicineId]
        : [];
  if (ids.length === 0 && lead.matchedMedicine) {
    return [lead.matchedMedicine];
  }
  return ids
    .map((id) => medicines.find((m) => m.id === id)?.name ?? id)
    .filter(Boolean);
}

export function LeadDetailsDisplay({
  lead,
  company,
  contact,
  medicines = [],
  showMeta = true,
  showCompanyLink = false,
}: LeadDetailsDisplayProps) {
  const city = company?.city ?? "";
  const country = company?.country ?? "";
  const gstin = company?.gstin ?? "";
  const pan = company?.pan ?? "";
  const phone = contact?.phone ?? "";
  const interestNames = resolveMedicineInterestNames(lead, medicines);
  const qualScore =
    lead.qualScore != null ? `${lead.qualScore} / ${QUAL_SCORE_MAX}` : undefined;

  return (
    <div className="space-y-3">
      {showMeta && (
        <DetailSection title="Lead record">
          <div className="grid grid-cols-12 gap-3">
            <DetailField label="Lead ID" value={lead.id} />
            <DetailField
              label="Date added"
              value={formatCrmDate(lead.createdAt)}
            />
            <DetailField label="Owner" value={lead.assignedTo} />
          </div>
        </DetailSection>
      )}

      <DetailSection title="Company & contact">
        <div className="grid grid-cols-12 gap-3">
          <DetailField label="Company name" value={lead.companyName} />
          <DetailField label="Company type" value={company?.companyType} />
          <DetailField label="Contact person" value={lead.contactName} />
          <DetailField label="Designation" value={lead.contactRole} />
          <DetailField label="Phone / WhatsApp" value={phone} />
          <DetailField label="Email">
            {lead.contactEmail ? (
              <a
                href={`mailto:${lead.contactEmail}`}
                className="text-primary inline-flex items-center gap-1 max-w-full min-w-0"
                title={lead.contactEmail}
              >
                <i className="ri-mail-line shrink-0"></i>
                <span className="truncate">{lead.contactEmail}</span>
              </a>
            ) : (
              leadDetailDash(undefined)
            )}
          </DetailField>
          <DetailField label="City" value={city} />
          <DetailField label="Country" value={country} />
          <DetailField
            label="Location"
            value={lead.location}
            className="col-span-12 md:col-span-4"
          />
          <DetailField label="Website">
            {company?.website?.trim() ? (
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary break-all"
              >
                {company.website}
              </a>
            ) : (
              leadDetailDash(undefined)
            )}
          </DetailField>
          <DetailField label="Certification" value={company?.certification} />
        </div>
        {showCompanyLink && lead.companyId && (
          <Link
            href={`/active-leads?company=${lead.companyId}`}
            className="text-[0.75rem] text-primary mt-2 inline-block"
          >
            View company leads →
          </Link>
        )}
      </DetailSection>

      <DetailSection title="Tax">
        <div className="grid grid-cols-12 gap-3">
          <DetailField label="GSTIN" value={gstin} />
          <DetailField label="PAN" value={pan} />
        </div>
      </DetailSection>

      <DetailSection title="Classification">
        <div className="grid grid-cols-12 gap-3">
          <DetailField label="Market tier" value={lead.marketTier} />
          <DetailField label="Segment" value={lead.segment} />
          <DetailField label="Lead source" value={lead.leadSource} />
        </div>
      </DetailSection>

      <DetailSection title="Products">
        <div className="grid grid-cols-12 gap-3 mb-3">
          <DetailField label="Primary salt" value={lead.matchedSalt} />
          <DetailField label="Primary medicine" value={lead.matchedMedicine} />
          <DetailField label="Dosage form" value={lead.dosageForm} />
        </div>
        <span className="text-[0.7rem] text-textmuted block mb-1.5">
          Product(s) of interest
        </span>
        {interestNames.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {interestNames.map((name) => (
              <span
                key={name}
                className="badge bg-primary/10 text-primary text-[0.75rem]"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[0.875rem] font-medium mb-0">{leadDetailDash(undefined)}</p>
        )}
      </DetailSection>

      <DetailSection title="Pipeline & metrics">
        <div className="grid grid-cols-12 gap-3">
          <DetailField
            label="Lead title"
            value={lead.title}
            className="col-span-12"
          />
          <DetailField label="Pipeline stage">
            <LeadStageBadge stage={lead.stage} />
          </DetailField>
          <DetailField label="Priority" value={lead.priority} />
          <DetailField label={`Qual. score (0–${QUAL_SCORE_MAX})`} value={qualScore} />
          <DetailField label="Discovery score">
            <LeadScoreBadge score={lead.leadScore} />
          </DetailField>
          <DetailField
            label="Potential qty (kg/yr)"
            value={lead.potentialQty}
          />
          <DetailField
            label="Est. annual value (INR Lakh)"
            value={lead.estAnnualValue}
          />
          <DetailField
            label="Last contact date"
            value={
              lead.lastContactDate
                ? formatCrmDate(lead.lastContactDate)
                : undefined
            }
          />
          <DetailField label="Next follow-up date">
            <FollowUpDateCell followUpDate={lead.followUpDate} />
          </DetailField>
          <DetailField
            label="Next action planned"
            value={lead.nextAction}
            className="col-span-12 md:col-span-8"
          />
          <DetailField
            label="Last activity"
            value={formatCrmDate(lead.lastActivity)}
          />
        </div>
      </DetailSection>

      <DetailSection title="Notes">
        <div className="space-y-3">
          <div>
            <span className="text-[0.7rem] text-textmuted block mb-1">
              Docs / info shared so far
            </span>
            <p className="text-[0.875rem] mb-0 whitespace-pre-wrap">
              {leadDetailDash(lead.docsShared)}
            </p>
          </div>
          <div>
            <span className="text-[0.7rem] text-textmuted block mb-1">
              Last discussion summary
            </span>
            <p className="text-[0.875rem] mb-0 whitespace-pre-wrap">
              {leadDetailDash(lead.lastDiscussionSummary)}
            </p>
          </div>
          <div>
            <span className="text-[0.7rem] text-textmuted block mb-1">Remarks</span>
            <p className="text-[0.875rem] mb-0 whitespace-pre-wrap">
              {leadDetailDash(lead.notes)}
            </p>
          </div>
        </div>
      </DetailSection>

      {lead.sourceLinks.length > 0 && (
        <DetailSection title="Source proof">
          <ul className="list-none mb-0 space-y-2 p-0">
            {lead.sourceLinks.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
    </div>
  );
}
