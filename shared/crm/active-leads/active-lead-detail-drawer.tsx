"use client";

import { companyInitials } from "@/shared/crm/active-leads/active-leads-utils";
import { FollowUpDateCell } from "@/shared/crm/active-leads/follow-up-date-cell";
import { LeadStageProgress } from "@/shared/crm/active-leads/lead-stage-progress";
import LeadStageBadge from "@/shared/crm/active-leads/lead-stage-badge";
import {
  getNextLeadStage,
  isTerminalStage,
  LEAD_STAGES,
} from "@/shared/crm/active-leads/lead-stages";
import { useCrm } from "@/shared/crm/store/crm-context";
import type { CrmEmail, CrmLead, CrmTimelineEvent, LeadStage } from "@/shared/crm/store/types";
import {
  emailPreviewSnippet,
  formatCrmDate,
  formatCrmDateTime,
} from "@/shared/crm/inbox/inbox-utils";
import LeadScoreBadge from "@/shared/crm/lead-discovery/lead-score-badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import SimpleBar from "simplebar-react";

type TabId = "overview" | "timeline" | "emails" | "notes";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "ri-layout-grid-line" },
  { id: "timeline", label: "Timeline", icon: "ri-time-line" },
  { id: "emails", label: "Emails", icon: "ri-mail-line" },
  { id: "notes", label: "Notes", icon: "ri-sticky-note-line" },
];

const TIMELINE_ICONS: Record<string, string> = {
  stage: "ri-flag-line",
  email: "ri-mail-send-line",
  note: "ri-sticky-note-line",
  call: "ri-phone-line",
  verification: "ri-shield-check-line",
  deal: "ri-hand-coin-line",
};

type ActiveLeadDetailDrawerProps = {
  lead: CrmLead | null;
  onClose: () => void;
  onSendEmail: (lead: CrmLead) => void;
};

function resolveTimelineEmailId(
  entry: CrmTimelineEvent,
  emails: CrmEmail[]
): string | null {
  if (entry.emailId) {
    const byId = emails.find((e) => e.id === entry.emailId);
    if (byId) return byId.id;
    const byMessageId = emails.find((e) => e.messageId === entry.emailId);
    if (byMessageId) return byMessageId.id;
  }
  const subject = entry.description.trim();
  if (!subject) return null;
  const bySubject = emails.find((e) => e.subject === subject);
  return bySubject?.id ?? null;
}

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="active-leads-info-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="active-leads-info-card-icon">
          <i className={icon}></i>
        </span>
        <h6 className="text-[0.75rem] font-semibold text-textmuted uppercase tracking-wide mb-0">
          {label}
        </h6>
      </div>
      {children}
    </div>
  );
}

export function ActiveLeadDetailDrawer({
  lead,
  onClose,
  onSendEmail,
}: ActiveLeadDetailDrawerProps) {
  const {
    getLeadEmails,
    getLeadTimeline,
    updateLead,
    setLeadStage,
    advanceLeadStage,
    verifyLead,
    markLeadLost,
    markLeadDormant,
    createDealFromLead,
    deals,
  } = useCrm();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [notesDraft, setNotesDraft] = useState("");
  const open = lead !== null;

  useEffect(() => {
    if (lead) setNotesDraft(lead.notes);
  }, [lead]);

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

  if (!lead) return null;

  const timeline = getLeadTimeline(lead.id);
  const emails = getLeadEmails(lead.id);
  const leadDeals = deals.filter((d) => d.leadId === lead.id);
  const nextStage = getNextLeadStage(lead.stage);

  const saveNotes = () => {
    if (notesDraft !== lead.notes) {
      updateLead(lead.id, { notes: notesDraft });
    }
  };

  const openEmailInInbox = (emailId: string) => {
    router.push(`/inbox?email=${encodeURIComponent(emailId)}`);
  };

  const handleTimelineClick = (entry: CrmTimelineEvent) => {
    if (entry.type !== "email") return;
    const emailId = resolveTimelineEmailId(entry, emails);
    if (emailId) {
      openEmailInInbox(emailId);
    }
  };

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-lead-title"
        className={`ti-offcanvas ti-offcanvas-right active-leads-drawer z-[150] ${
          open ? "open" : ""
        }`}
      >
        <div className="active-leads-drawer-header-block active-leads-drawer-hero">
          <button
            type="button"
            className="active-leads-drawer-close"
            onClick={onClose}
            aria-label="Close lead profile"
          >
            <i className="ri-close-line"></i>
          </button>
          <div className="flex items-start gap-3 pe-8">
            <span className="active-leads-drawer-avatar">
              {companyInitials(lead.companyName)}
            </span>
            <div className="min-w-0 flex-1">
              <h5
                id="active-lead-title"
                className="text-[1.0625rem] font-semibold text-defaulttextcolor leading-snug mb-1"
              >
                {lead.title}
              </h5>
              <p className="text-[0.8125rem] text-textmuted mb-2 flex items-center gap-1">
                <i className="ri-building-2-line"></i>
                {lead.companyName}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <LeadStageBadge stage={lead.stage} />
                <LeadScoreBadge score={lead.leadScore} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-defaultborder/60 dark:border-white/10">
            <LeadStageProgress stage={lead.stage} />
          </div>
        </div>

        <div className="active-leads-drawer-header-block active-leads-drawer-stage-bar border-b border-defaultborder dark:border-defaultborder/10">
          <div className="active-leads-drawer-stage-row">
            <label
              htmlFor="lead-stage-select"
              className="active-leads-drawer-stage-label"
            >
              Stage
            </label>
            <select
              id="lead-stage-select"
              className="form-select form-select-sm active-leads-drawer-stage-select w-full"
              value={lead.stage}
              onChange={(e) =>
                setLeadStage(lead.id, e.target.value as LeadStage)
              }
            >
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {(lead.stage === "Saved" ||
            (nextStage && !isTerminalStage(lead.stage)) ||
            !isTerminalStage(lead.stage)) && (
            <div className="active-leads-drawer-stage-actions">
              {lead.stage === "Saved" && (
                <button
                  type="button"
                  className="ti-btn ti-btn-success active-leads-drawer-btn"
                  onClick={() => verifyLead(lead.id)}
                >
                  Verify
                </button>
              )}
              {nextStage && !isTerminalStage(lead.stage) && (
                <button
                  type="button"
                  className="ti-btn ti-btn-primary active-leads-drawer-btn"
                  onClick={() => advanceLeadStage(lead.id)}
                  title={`Advance to ${nextStage}`}
                >
                  <i className="ri-arrow-right-line me-1"></i>
                  <span className="truncate max-w-[10rem]">{nextStage}</span>
                </button>
              )}
              {!isTerminalStage(lead.stage) && (
                <>
                  <button
                    type="button"
                    className="ti-btn ti-btn-light active-leads-drawer-btn"
                    onClick={() => markLeadDormant(lead.id)}
                  >
                    Dormant
                  </button>
                  <button
                    type="button"
                    className="ti-btn ti-btn-danger active-leads-drawer-btn"
                    onClick={() => markLeadLost(lead.id)}
                  >
                    Lost
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="active-leads-drawer-header-block active-leads-drawer-meta px-4 py-2.5 border-b border-defaultborder dark:border-defaultborder/10 grid grid-cols-2 gap-3 text-[0.8125rem]">
          <div>
            <span className="text-textmuted block text-[0.7rem]">Assigned</span>
            <strong className="font-medium">{lead.assignedTo}</strong>
          </div>
          <div>
            <span className="text-textmuted block text-[0.7rem]">Follow-up</span>
            <FollowUpDateCell followUpDate={lead.followUpDate} />
          </div>
        </div>

        <div className="active-leads-drawer-header-block active-leads-drawer-tabs border-b border-defaultborder dark:border-defaultborder/10">
          <div className="active-leads-drawer-tabs-inner" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`active-leads-drawer-tab ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`${tab.icon} me-1`}></i>
                {tab.label}
                {tab.id === "emails" && emails.length > 0 && (
                  <span className="ms-1 badge bg-primary/15 text-primary text-[0.6rem]">
                    {emails.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <SimpleBar className="active-leads-drawer-scroll flex-1 min-h-0">
          <div className="active-leads-drawer-body">
          {activeTab === "overview" && (
            <div className="py-4 space-y-3" role="tabpanel">
              <InfoCard icon="ri-building-4-line" label="Company">
                <p className="font-semibold text-[0.875rem] mb-0.5">
                  {lead.companyName}
                </p>
                <p className="text-[0.8125rem] text-textmuted mb-2">
                  <i className="ri-map-pin-line me-1"></i>
                  {lead.location}
                </p>
                <Link
                  href={`/active-leads?company=${lead.companyId}`}
                  className="text-[0.75rem] text-primary"
                >
                  View company leads →
                </Link>
              </InfoCard>

              <InfoCard icon="ri-user-3-line" label="Contact">
                <p className="font-semibold text-[0.875rem] mb-0">
                  {lead.contactName}
                </p>
                <p className="text-[0.75rem] text-textmuted mb-2">
                  {lead.contactRole}
                </p>
                {lead.contactEmail && (
                  <a
                    href={`mailto:${lead.contactEmail}`}
                    className="text-[0.8125rem] text-primary inline-flex items-center gap-1"
                  >
                    <i className="ri-mail-line"></i>
                    {lead.contactEmail}
                  </a>
                )}
              </InfoCard>

              <InfoCard icon="ri-capsule-line" label="Product match">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="badge bg-primary/10 text-primary">
                    {lead.matchedSalt}
                  </span>
                  <span className="badge bg-light text-defaulttextcolor">
                    {lead.dosageForm}
                  </span>
                </div>
                <p className="text-[0.875rem] mb-0">{lead.matchedMedicine}</p>
              </InfoCard>

              {lead.sourceLinks.length > 0 && (
                <InfoCard icon="ri-links-line" label="Source proof">
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
                </InfoCard>
              )}

              {leadDeals.length > 0 && (
                <InfoCard icon="ri-hand-coin-line" label="Deals">
                  {leadDeals.map((d) => (
                    <div key={d.id} className="text-[0.875rem] mb-1">
                      <strong>{d.title}</strong> — {d.value} ({d.stage})
                    </div>
                  ))}
                </InfoCard>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="active-leads-info-card !mb-0">
                  <span className="text-[0.7rem] text-textmuted block">
                    Last activity
                  </span>
                  <span className="text-[0.875rem] font-medium">
                    {formatCrmDate(lead.lastActivity)}
                  </span>
                </div>
                <div className="active-leads-info-card !mb-0">
                  <span className="text-[0.7rem] text-textmuted block">Created</span>
                  <span className="text-[0.875rem] font-medium">
                    {formatCrmDate(lead.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="py-4" role="tabpanel">
              <ul className="list-none mb-0 active-leads-timeline">
                {timeline.map((entry) => {
                  const isEmailEvent = entry.type === "email";
                  const linkedEmailId = isEmailEvent
                    ? resolveTimelineEmailId(entry, emails)
                    : null;
                  const isClickable = Boolean(linkedEmailId);

                  return (
                  <li
                    key={entry.id}
                    className={`active-leads-timeline-item${isClickable ? " is-clickable" : ""}`}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    title={isClickable ? "Open in Inbox" : undefined}
                    onClick={
                      isClickable ? () => handleTimelineClick(entry) : undefined
                    }
                    onKeyDown={
                      isClickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleTimelineClick(entry);
                            }
                          }
                        : undefined
                    }
                  >
                    <span className="active-leads-timeline-icon">
                      <i
                        className={
                          TIMELINE_ICONS[entry.type] ?? "ri-circle-line"
                        }
                      ></i>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-semibold text-[0.875rem]">
                          {entry.title}
                        </span>
                        <span className="text-[0.7rem] text-textmuted shrink-0">
                          {formatCrmDate(entry.date)}
                        </span>
                      </div>
                      <p className="text-[0.8125rem] text-textmuted mb-0">
                        {entry.description}
                      </p>
                      {isClickable && (
                        <span className="active-leads-timeline-link-hint">
                          <i className="ri-inbox-line me-1"></i>
                          View in Inbox
                        </span>
                      )}
                    </div>
                  </li>
                  );
                })}
              </ul>
            </div>
          )}

          {activeTab === "emails" && (
            <div className="py-4 space-y-3" role="tabpanel">
              {emails.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[0.875rem] text-textmuted mb-2">
                    No emails yet. Send outreach to start the thread.
                  </p>
                  <button
                    type="button"
                    className="ti-btn ti-btn-primary active-leads-drawer-btn"
                    onClick={() => onSendEmail(lead)}
                  >
                    Send email
                  </button>
                </div>
              ) : (
                emails.map((email) => (
                  <Link
                    key={email.id}
                    href={`/inbox?email=${encodeURIComponent(email.id)}`}
                    className="active-leads-email-card block no-underline text-inherit"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`badge text-[0.65rem] ${
                          email.direction === "inbound"
                            ? "bg-info/10 text-info"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {email.direction === "inbound" ? "Received" : "Sent"}
                      </span>
                      <span className="text-[0.75rem] text-textmuted">
                        {formatCrmDateTime(email.sentAt)}
                      </span>
                    </div>
                    <div className="font-medium text-[0.875rem] mb-1">
                      {email.subject}
                    </div>
                    <p className="text-[0.8125rem] text-textmuted mb-0 line-clamp-2">
                      {emailPreviewSnippet(email)}
                    </p>
                  </Link>
                ))
              )}
              <Link href="/inbox" className="text-[0.75rem] text-primary">
                Open Inbox →
              </Link>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="py-4" role="tabpanel">
              <textarea
                className="form-control text-[0.875rem] mb-2"
                rows={6}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={saveNotes}
              />
              <button
                type="button"
                className="ti-btn ti-btn-light active-leads-drawer-btn"
                onClick={saveNotes}
              >
                Save notes
              </button>
            </div>
          )}
          </div>
        </SimpleBar>

        <div className="ti-offcanvas-footer active-leads-drawer-footer !shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            className="ti-btn ti-btn-primary"
            onClick={() => onSendEmail(lead)}
          >
            <i className="ri-mail-send-line me-1"></i>
            Send email
          </button>
          {lead.stage === "Negotiation" && leadDeals.length === 0 && (
            <button
              type="button"
              className="ti-btn ti-btn-success"
              onClick={() => createDealFromLead(lead.id)}
            >
              Close deal
            </button>
          )}
          <button type="button" className="ti-btn ti-btn-light" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
