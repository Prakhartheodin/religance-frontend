"use client";

import type { CrmContact } from "@/shared/crm/store/types";
import { InboxAvatar } from "./inbox-avatar";

export function InboxContactsRail({
  contacts,
  onComposeTo,
}: {
  contacts: CrmContact[];
  onComposeTo: (email: string) => void;
}) {
  const visible = contacts.slice(0, 12);

  return (
    <aside className="crm-inbox-contacts-rail" aria-label="Online contacts">
      <button
        type="button"
        className="crm-inbox-contacts-add"
        title="New message"
        onClick={() => onComposeTo("")}
      >
        <i className="ri-add-line"></i>
      </button>
      {visible.map((ct, index) => (
        <button
          key={ct.id}
          type="button"
          className="crm-inbox-contacts-item"
          title={`${ct.name} · ${ct.email}`}
          onClick={() => onComposeTo(ct.email)}
        >
          <span className="crm-inbox-contacts-avatar-wrap">
            <InboxAvatar name={ct.name} size="sm" />
            {index < 5 && <span className="crm-inbox-online-dot" />}
          </span>
        </button>
      ))}
    </aside>
  );
}
