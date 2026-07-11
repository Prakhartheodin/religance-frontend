"use client";

import { companyInitials } from "@/shared/crm/active-leads/active-leads-utils";
import LeadStageBadge from "@/shared/crm/active-leads/lead-stage-badge";
import type { CrmCompany, CrmEmail, CrmLead } from "@/shared/crm/store/types";
import Link from "next/link";
import { InboxAvatar } from "./inbox-avatar";
import { REPLY_TOOLBAR_GROUPS } from "./inbox-constants";
import { splitEmailBody } from "./inbox-utils";
import { getUserDisplayName } from "@/shared/auth/auth-client";
import type { InboxRowMeta } from "./inbox-list";

function formatDetailDate(sentAt: string): string {
  const d = new Date(sentAt);
  if (Number.isNaN(d.getTime())) return sentAt;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InboxDetailPanel({
  active,
  meta,
  mailboxDisplayName,
  gmailConnected,
  starred,
  onToggleStar,
  onMarkUnread,
  onArchive,
  onDelete,
  replyText,
  onReplyChange,
  onSendReply,
  sending,
  sentFlash,
  leads,
  companies,
  suggested,
  suggestedCompany,
  onLinkLead,
}: {
  active: CrmEmail;
  meta: InboxRowMeta & { lead?: CrmLead };
  mailboxDisplayName?: string | null;
  gmailConnected: boolean;
  starred: boolean;
  onToggleStar: () => void;
  onMarkUnread: () => void;
  onArchive: () => void;
  onDelete: () => void;
  replyText: string;
  onReplyChange: (v: string) => void;
  onSendReply: () => void;
  sending?: boolean;
  sentFlash?: boolean;
  leads: CrmLead[];
  companies: CrmCompany[];
  suggested: CrmLead | null;
  suggestedCompany: CrmCompany | null | undefined;
  onLinkLead: (leadId: string) => void;
}) {
  const company =
    meta.lead && companies.find((c) => c.id === meta.lead!.companyId);
  const userName = mailboxDisplayName?.trim() || getUserDisplayName();
  const replyTo =
    active.direction === "inbound" ? active.fromEmail : active.toEmail;
  const paragraphs = splitEmailBody(active.body);
  const showAttachments =
    meta.tag === "finance" ||
    /coa|attach|invoice|pdf/i.test(active.subject + active.body);

  return (
    <section className="crm-inbox-detail">
      <div className="crm-inbox-detail-top">
        <div className="crm-inbox-detail-sender">
          <InboxAvatar name={meta.from} size="lg" />
          <div>
            <p className="crm-inbox-detail-from">{meta.from}</p>
            <p className="crm-inbox-detail-email">{meta.peer}</p>
          </div>
        </div>
        <div className="crm-inbox-detail-actions">
          <button
            type="button"
            className={`crm-inbox-icon-btn ${starred ? "is-active" : ""}`}
            onClick={onToggleStar}
            title="Star"
          >
            <i className={starred ? "ri-star-fill" : "ri-star-line"}></i>
          </button>
          <button
            type="button"
            className="crm-inbox-icon-btn"
            onClick={onArchive}
            title="Archive"
          >
            <i className="ri-archive-line"></i>
          </button>
          <button
            type="button"
            className="crm-inbox-icon-btn"
            onClick={onMarkUnread}
            title="Mark unread"
          >
            <i className="ri-time-line"></i>
          </button>
          <button
            type="button"
            className="crm-inbox-icon-btn"
            onClick={onDelete}
            title="Delete"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
          <button type="button" className="crm-inbox-icon-btn" title="Reply all">
            <i className="ri-reply-all-line"></i>
          </button>
        </div>
      </div>

      <div className="crm-inbox-detail-subject-row">
        <h1 className="crm-inbox-detail-subject">{active.subject}</h1>
        <time className="crm-inbox-detail-datetime">
          {formatDetailDate(active.sentAt)}
        </time>
      </div>

      <div className="crm-inbox-detail-scroll">
        {meta.lead && company && (
          <div className="crm-inbox-lead-context">
            <div className="crm-inbox-lead-context-avatar">
              {companyInitials(company.name)}
            </div>
            <div className="crm-inbox-lead-context-body">
              <p className="crm-inbox-lead-context-company">{company.name}</p>
              <p className="crm-inbox-lead-context-title">{meta.lead.title}</p>
            </div>
            <LeadStageBadge stage={meta.lead.stage} compact />
            <Link
              href={`/active-leads?lead=${meta.lead.id}`}
              className="ti-btn ti-btn-sm ti-btn-soft-primary"
            >
              Open lead
            </Link>
          </div>
        )}

        {!active.leadId && gmailConnected && (
          <div className="crm-inbox-link-banner">
            <i className="ri-link-unlink-m"></i>
            <div>
              <strong>Link to a lead</strong>
              {suggested && suggestedCompany ? (
                <p>
                  Suggested: {suggestedCompany.name} — {suggested.title}
                </p>
              ) : (
                <p>Track pipeline and follow-ups after linking.</p>
              )}
              <div className="crm-inbox-link-banner-actions">
                <select
                  className="form-select form-select-sm"
                  defaultValue=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id) onLinkLead(id);
                    e.target.value = "";
                  }}
                >
                  <option value="">Choose lead…</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
                {suggested && (
                  <button
                    type="button"
                    className="ti-btn ti-btn-sm ti-btn-primary"
                    onClick={() => onLinkLead(suggested.id)}
                  >
                    Use suggestion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <article className="crm-inbox-message-card">
          <p className="crm-inbox-message-greeting">
            Hi, {userName} Greetings 👋
          </p>
          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <p className="crm-inbox-message-signoff mb-0">
            Regards,
            <br />
            Religence Sales
          </p>
        </article>

        {showAttachments && (
          <div className="crm-inbox-attachments">
            <div className="crm-inbox-attachments-head">
              <span>
                <i className="ri-attachment-2 me-1"></i>
                Attachments (1.2mb)
              </span>
              <button type="button" className="crm-inbox-download-all">
                Download All
              </button>
            </div>
            <div className="crm-inbox-attachment-grid">
              <div className="crm-inbox-attachment-card">
                <i className="ri-file-pdf-line text-danger"></i>
                <div>
                  <p>COA_Spec_Sheet.pdf</p>
                  <span>842 KB</span>
                </div>
              </div>
              <div className="crm-inbox-attachment-card">
                <i className="ri-image-line text-info"></i>
                <div>
                  <p>Product_Label.jpg</p>
                  <span>384 KB</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="crm-inbox-reply">
        {sentFlash && (
          <div className="crm-inbox-sent-toast" role="status">
            <i className="ri-checkbox-circle-fill"></i>
            Message sent successfully
          </div>
        )}
        <div className="crm-inbox-reply-card">
          <div className="crm-inbox-reply-label-row">
            <button type="button" className="crm-inbox-toolbar-btn" aria-label="Back">
              <i className="ri-arrow-left-line"></i>
            </button>
            <span className="crm-inbox-reply-label">Reply :</span>
          </div>
          <div className="crm-inbox-reply-toolbar">
            {REPLY_TOOLBAR_GROUPS.map((group, gi) =>
              group.type === "select" ? (
                <select
                  key={gi}
                  className="crm-inbox-toolbar-select"
                  defaultValue={group.options[0]}
                  aria-label="Text style"
                >
                  {group.options.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                group.icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className="crm-inbox-toolbar-btn"
                  >
                    <i className={icon}></i>
                  </button>
                ))
              )
            )}
          </div>
          <textarea
            value={replyText}
            onChange={(e) => onReplyChange(e.target.value)}
            disabled={!gmailConnected}
            placeholder={`Write your reply to ${meta.from}…`}
            className="crm-inbox-reply-input"
            rows={6}
          />
          <div className="crm-inbox-reply-actions">
            <div className="crm-inbox-reply-actions-left">
              <button type="button" className="crm-inbox-toolbar-btn">
                <i className="ri-printer-line"></i>
              </button>
              <button type="button" className="crm-inbox-toolbar-btn">
                <i className="ri-folder-transfer-line"></i>
              </button>
              <button type="button" className="crm-inbox-toolbar-btn">
                <i className="ri-refresh-line"></i>
              </button>
            </div>
            <div className="crm-inbox-reply-actions-right">
              <button type="button" className="crm-inbox-btn-forward">
                Forward
              </button>
              <button
                type="button"
                className="crm-inbox-btn-reply"
                disabled={!gmailConnected || !replyText.trim() || sending}
                onClick={onSendReply}
              >
                {sending ? "Sending…" : "Reply"}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

export function InboxDetailEmpty() {
  return (
    <div className="crm-inbox-detail-empty">
      <span className="crm-inbox-empty-icon">
        <i className="ri-mail-open-line"></i>
      </span>
      <h3>Select a message</h3>
      <p>Pick an email from the list to read and reply.</p>
    </div>
  );
}
