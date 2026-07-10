"use client";

import { inboxAvatarInitials, inboxAvatarTone } from "./inbox-utils";

export function InboxAvatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const tone = inboxAvatarTone(name);
  const sizeClass =
    size === "lg" ? "crm-inbox-avatar--lg" : size === "sm" ? "crm-inbox-avatar--sm" : "";
  return (
    <span
      className={`crm-inbox-avatar tone-${tone} ${sizeClass} ${className}`.trim()}
      aria-hidden
    >
      {inboxAvatarInitials(name)}
    </span>
  );
}
