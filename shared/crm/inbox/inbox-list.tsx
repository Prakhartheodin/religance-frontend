"use client";

import type { CrmEmail } from "@/shared/crm/store/types";
import { InboxAvatar } from "./inbox-avatar";
import type { InboxFolderName } from "./inbox-constants";
import {
  formatInboxTime,
  INBOX_LIST_TAG_CLASS,
  INBOX_TAG_LABELS,
} from "./inbox-utils";

export type InboxRowMeta = {
  from: string;
  peer: string;
  tag: import("./inbox-utils").InboxTag;
  read: boolean;
  lead?: { title: string; stage: import("@/shared/crm/store/types").LeadStage };
};

export function InboxListPanel({
  gmailConnected,
  onConnect,
  activeFolder,
  searchQuery,
  onSearchChange,
  emails,
  rowMeta,
  selectedId,
  onSelect,
  starredIds,
  onToggleStar,
  checkedIds,
  onToggleCheck,
  onToggleCheckAll,
  allChecked,
  loading = false,
}: {
  gmailConnected: boolean;
  onConnect: () => void;
  loading?: boolean;
  activeFolder: InboxFolderName;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  emails: CrmEmail[];
  rowMeta: (email: CrmEmail) => InboxRowMeta;
  selectedId: string | null;
  onSelect: (id: string) => void;
  starredIds: string[];
  onToggleStar: (id: string, ev: React.MouseEvent) => void;
  checkedIds: string[];
  onToggleCheck: (id: string) => void;
  onToggleCheckAll: () => void;
  allChecked: boolean;
}) {
  return (
    <section className="crm-inbox-list-panel">
      <header className="crm-inbox-list-toolbar">
        <div className="crm-inbox-list-toolbar-left">
          <input
            type="checkbox"
            className="form-check-input crm-inbox-check"
            checked={allChecked && emails.length > 0}
            onChange={onToggleCheckAll}
            aria-label="Select all"
          />
          <h2 className="crm-inbox-list-folder-title">{activeFolder}</h2>
        </div>
        <button
          type="button"
          className="crm-inbox-icon-btn"
          aria-label="More actions"
        >
          <i className="ri-more-2-fill"></i>
        </button>
      </header>

      <div className="crm-inbox-search">
        <i className="ri-search-line"></i>
        <input
          type="search"
          placeholder="Search Email"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="crm-inbox-list-scroll">
        {!gmailConnected ? (
          <InboxEmptyState
            icon="ri-mail-lock-line"
            title="Connect your inbox"
            description="Sync Outlook to load threads and send from CRM."
            action={
              <button type="button" className="crm-inbox-connect-btn" onClick={onConnect}>
                Connect Outlook
              </button>
            }
          />
        ) : loading ? (
          <InboxListSkeleton />
        ) : emails.length === 0 ? (
          <InboxEmptyState
            icon="ri-inbox-archive-line"
            title="No messages"
            description="Try another folder or label."
          />
        ) : (
          emails.map((email) => {
            const meta = rowMeta(email);
            const selected = selectedId === email.id;
            const starred = starredIds.includes(email.id);
            const checked = checkedIds.includes(email.id);
            const tagLabel = INBOX_TAG_LABELS[meta.tag];
            return (
              <article
                key={email.id}
                className={`crm-inbox-list-item ${selected ? "is-selected" : ""} ${!meta.read ? "is-unread" : ""}`}
              >
                <input
                  type="checkbox"
                  className="form-check-input crm-inbox-check crm-inbox-row-check"
                  checked={checked}
                  onChange={() => onToggleCheck(email.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${email.subject}`}
                />
                <button
                  type="button"
                  className="crm-inbox-list-item-main"
                  onClick={() => onSelect(email.id)}
                >
                  <InboxAvatar name={meta.from} size="md" />
                  <div className="crm-inbox-list-item-body">
                    <div className="crm-inbox-list-item-row">
                      <div className="crm-inbox-list-sender-wrap">
                        <span className="crm-inbox-list-sender">{meta.from}</span>
                        <span
                          className={`crm-inbox-list-tag ${INBOX_LIST_TAG_CLASS[meta.tag]}`}
                        >
                          {tagLabel}
                        </span>
                      </div>
                      <span className="crm-inbox-list-time">
                        {formatInboxTime(email.sentAt)}
                      </span>
                    </div>
                    <p className="crm-inbox-list-subject">{email.subject}</p>
                    <p className="crm-inbox-list-preview">{email.preview}</p>
                  </div>
                </button>
                <div className="crm-inbox-list-item-end">
                  <button
                    type="button"
                    className={`crm-inbox-star-btn ${starred ? "is-starred" : ""}`}
                    onClick={(e) => onToggleStar(email.id, e)}
                    aria-label={starred ? "Unstar" : "Star"}
                  >
                    <i className={starred ? "ri-star-fill" : "ri-star-line"}></i>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

/**
 * Mirrors the real row's structure so the list doesn't reflow when mail lands.
 * A skeleton, not a spinner: the switch usually resolves in about a second, and
 * a shape that matches the content reads as "loading" without a blocking overlay.
 */
function InboxListSkeleton() {
  return (
    <div
      className="crm-inbox-list-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading messages"
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="crm-inbox-list-item crm-inbox-skeleton-item">
          <span className="crm-inbox-skeleton-avatar crm-inbox-shimmer" />
          <div className="crm-inbox-skeleton-body">
            <div className="crm-inbox-skeleton-row">
              <span className="crm-inbox-shimmer crm-inbox-skeleton-sender" />
              <span className="crm-inbox-shimmer crm-inbox-skeleton-time" />
            </div>
            <span className="crm-inbox-shimmer crm-inbox-skeleton-subject" />
            <span className="crm-inbox-shimmer crm-inbox-skeleton-preview" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InboxEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="crm-inbox-empty">
      <span className="crm-inbox-empty-icon">
        <i className={icon}></i>
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
