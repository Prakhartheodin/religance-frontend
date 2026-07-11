"use client";

import { getUser, getUserDisplayName } from "@/shared/auth/auth-client";
import { resolveMailboxProfile } from "./inbox-utils";
import {
  INBOX_FOLDERS,
  INBOX_LABELS,
  type InboxFolderName,
} from "./inbox-constants";
import type { InboxTag } from "./inbox-utils";
import { InboxAvatar } from "./inbox-avatar";

export function InboxSidebar({
  gmailConnected,
  accountEmail,
  accountDisplayName,
  onDisconnectOutlook,
  onConnect,
  onCompose,
  activeFolder,
  onFolderChange,
  folderCounts,
  activeTag,
  onTagChange,
}: {
  gmailConnected: boolean;
  accountEmail: string | null;
  accountDisplayName?: string | null;
  onDisconnectOutlook?: () => void | Promise<void>;
  onConnect: () => void;
  onCompose: () => void;
  activeFolder: InboxFolderName;
  onFolderChange: (folder: InboxFolderName) => void;
  folderCounts: Partial<Record<InboxFolderName, number>>;
  activeTag: InboxTag | null;
  onTagChange: (tag: InboxTag | null) => void;
}) {
  const mailboxProfile =
    gmailConnected && accountEmail
      ? resolveMailboxProfile({
          email: accountEmail,
          displayName: accountDisplayName,
        })
      : null;
  const displayName = mailboxProfile?.name ?? getUserDisplayName();
  const displayEmail = mailboxProfile?.email ?? getUser()?.email ?? accountEmail;

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
          <InboxAvatar name={displayName} size="lg" />
          <div className="crm-inbox-profile-meta">
            <p className="crm-inbox-profile-name">{displayName}</p>
            <p className="crm-inbox-profile-email">
              {gmailConnected
                ? displayEmail ?? "Outlook connected"
                : displayEmail ?? "Connect Outlook to sync"}
            </p>
            {gmailConnected && onDisconnectOutlook ? (
              <button
                type="button"
                className="crm-inbox-profile-logout"
                onClick={() => void onDisconnectOutlook()}
              >
                <i className="ri-logout-box-r-line" aria-hidden />
                Disconnect Outlook
              </button>
            ) : null}
          </div>
        </div>

        {!gmailConnected && (
          <button
            type="button"
            className="crm-inbox-connect-btn"
            onClick={onConnect}
          >
            <i className="ri-microsoft-fill me-1"></i>
            Connect Outlook
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

    </aside>
  );
}
