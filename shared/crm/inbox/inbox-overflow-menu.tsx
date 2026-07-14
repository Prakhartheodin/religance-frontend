"use client";

import { useEffect, useId, useRef, useState } from "react";

export type InboxOverflowItem = {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

export function InboxOverflowMenu({
  items,
  align = "end",
  ariaLabel = "More actions",
}: {
  items: InboxOverflowItem[];
  align?: "start" | "end";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className={`crm-inbox-overflow ${open ? "is-open" : ""}`}
    >
      <button
        type="button"
        className="crm-inbox-icon-btn"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <i className="ri-more-2-fill" aria-hidden />
      </button>
      <ul
        id={menuId}
        role="menu"
        className={`crm-inbox-overflow-menu crm-inbox-overflow-menu--${align}`}
      >
        {items.map((item) => (
          <li key={item.id} role="none">
            <button
              type="button"
              role="menuitem"
              className={`crm-inbox-overflow-item${
                item.destructive ? " is-destructive" : ""
              }`}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onClick();
                setOpen(false);
              }}
            >
              {item.icon ? <i className={item.icon} aria-hidden /> : null}
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
