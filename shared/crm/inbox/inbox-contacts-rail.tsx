"use client";

import type { OutlookMailboxAccount } from "@/shared/crm/store/types";
import { InboxAvatar } from "./inbox-avatar";

export function InboxContactsRail({
  accounts,
  activeAccountId,
  onSwitchAccount,
  onConnectAccount,
  connecting,
  switchingAccountId = null,
}: {
  accounts: OutlookMailboxAccount[];
  activeAccountId: string | null;
  onSwitchAccount: (accountId: string) => void | Promise<void>;
  onConnectAccount: () => void;
  connecting?: boolean;
  switchingAccountId?: string | null;
}) {
  const visible = accounts.slice(0, 12);

  return (
    <aside className="crm-inbox-contacts-rail" aria-label="Outlook accounts">
      <button
        type="button"
        className="crm-inbox-contacts-add"
        title="Connect another Outlook account"
        onClick={onConnectAccount}
        disabled={connecting}
      >
        {connecting ? (
          <span className="spinner-border spinner-border-sm" aria-hidden></span>
        ) : (
          <i className="ri-add-line"></i>
        )}
      </button>
      {visible.map((account) => {
        const isSwitching = account.id === switchingAccountId;
        return (
          <button
            key={account.id}
            type="button"
            className={`crm-inbox-contacts-item ${account.id === activeAccountId ? "is-active" : ""}`}
            title={account.email}
            onClick={() => onSwitchAccount(account.id)}
            disabled={Boolean(switchingAccountId)}
            aria-busy={isSwitching}
          >
            <span className="crm-inbox-contacts-avatar-wrap">
              <InboxAvatar
                name={(account.email.split("@")[0] || account.email).toUpperCase()}
                size="sm"
              />
              {isSwitching ? (
                <span
                  className="spinner-border spinner-border-sm crm-inbox-contacts-spinner"
                  aria-hidden
                />
              ) : null}
              <span
                className={`crm-inbox-online-dot ${
                  account.id === activeAccountId ? "is-active" : ""
                }`}
              />
            </span>
          </button>
        );
      })}
    </aside>
  );
}
