"use client";

import { CURRENT_USER } from "@/shared/crm/store/types";
import type { CrmContact } from "@/shared/crm/store/types";
import Link from "next/link";
import {
  INBOX_FOLDERS,
  INBOX_LABELS,
  type InboxFolderName,
} from "./inbox-constants";
import type { InboxTag } from "./inbox-utils";
import { InboxAvatar } from "./inbox-avatar";

export function InboxSidebar({
  gmailConnected,
  onConnect,
  onCompose,
  activeFolder,
  onFolderChange,
  folderCounts,
  activeTag,
  onTagChange,
  onlineContacts,
}: {
  gmailConnected: boolean;
  onConnect: () => void;
  onCompose: () => void;
  activeFolder: InboxFolderName;
  onFolderChange: (folder: InboxFolderName) => void;
  folderCounts: Partial<Record<InboxFolderName, number>>;
  activeTag: InboxTag | null;
  onTagChange: (tag: InboxTag | null) => void;
  onlineContacts: CrmContact[];
}) {
  return (
    <aside className="crm-inbox-sidebar">
      <div className="crm-inbox-sidebar-scroll">
        <button
          type="button"
          disabled={!gmailConnected}
          onClick={onCompose}
          className="crm-inbox-compose-mail"
        >
          <i className="ri-add-line"></i>
          Compose Mail
        </button>

        <div className="crm-inbox-profile-card">
          <InboxAvatar name={CURRENT_USER} size="lg" />
          <div className="crm-inbox-profile-meta">
            <p className="crm-inbox-profile-name">{CURRENT_USER}</p>
            <p className="crm-inbox-profile-email">
              {gmailConnected
                ? "sales@religence.example.com"
                : "Connect Gmail to sync"}
            </p>
          </div>
        </div>

        {!gmailConnected && (
          <button
            type="button"
            className="crm-inbox-connect-btn"
            onClick={onConnect}
          >
            <i className="ri-google-fill me-1"></i>
            Connect Gmail
          </button>
        )}

        <p className="crm-inbox-nav-title">Mails</p>
        <nav className="crm-inbox-folders" aria-label="Mail folders">
          {INBOX_FOLDERS.map((f) => {
            const count = folderCounts[f.name] ?? 0;
            return (
              <button
                key={f.name}
                type="button"
                onClick={() => {
                  onFolderChange(f.name);
                  onTagChange(null);
                }}
                className={`crm-inbox-folder-btn ${activeFolder === f.name ? "is-active" : ""}`}
              >
                <span className="crm-inbox-folder-label">
                  <i className={f.icon}></i>
                  {f.name}
                </span>
                {count > 0 && (
                  <span
                    className={`crm-inbox-folder-badge ${f.badge ? `badge-${f.badge}` : ""}`}
                  >
                    {count > 9999 ? "9999+" : count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <p className="crm-inbox-nav-title">Labels</p>
        <div className="crm-inbox-label-list">
          {INBOX_LABELS.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() =>
                onTagChange(activeTag === t.name ? null : t.name)
              }
              className={`crm-inbox-label-btn ${activeTag === t.name ? "is-active" : ""}`}
            >
              <i className={`ri-shopping-bag-3-fill crm-inbox-label-bag ${t.bagClass}`}></i>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="crm-inbox-online-users">
        <p className="crm-inbox-nav-title">Online Users</p>
        <div className="crm-inbox-online-list">
          {onlineContacts.slice(0, 6).map((ct, i) => (
            <span
              key={ct.id}
              className="crm-inbox-online-avatar"
              title={ct.name}
            >
              <InboxAvatar name={ct.name} size="sm" />
              {i < 4 && <span className="crm-inbox-online-dot" />}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
