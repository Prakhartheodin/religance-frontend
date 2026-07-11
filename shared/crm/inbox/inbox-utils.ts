import type { CrmContact, CrmEmail, CrmLead } from "@/shared/crm/store/types";

export type InboxTag = "lead" | "unlinked" | "internal" | "finance";

export const INBOX_TAG_COLORS: Record<InboxTag, string> = {
  lead: "bg-primary/10 text-primary",
  unlinked: "bg-warning/10 text-warning",
  internal: "bg-info/10 text-info",
  finance: "bg-success/10 text-success",
};

export const INBOX_TAG_LABELS: Record<InboxTag, string> = {
  lead: "Promotion",
  unlinked: "Personal",
  internal: "Social",
  finance: "Promotion",
};

export const INBOX_LIST_TAG_CLASS: Record<InboxTag, string> = {
  lead: "crm-inbox-list-tag--promo",
  unlinked: "crm-inbox-list-tag--personal",
  internal: "crm-inbox-list-tag--social",
  finance: "crm-inbox-list-tag--promo",
};

const AVATAR_TONES = [
  "primary",
  "success",
  "info",
  "warning",
  "secondary",
] as const;

export type InboxAvatarTone = (typeof AVATAR_TONES)[number];

export function inboxAvatarTone(seed: string): InboxAvatarTone {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h + seed.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[h];
}

export function inboxAvatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatInboxTime(sentAt: string): string {
  const d = new Date(sentAt);
  if (Number.isNaN(d.getTime())) return sentAt;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function titleCaseFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function resolveSenderName(
  email: CrmEmail,
  leads: CrmLead[],
  contacts: CrmContact[]
): string {
  const peer =
    email.direction === "inbound" ? email.fromEmail : email.toEmail;
  const lead = email.leadId
    ? leads.find((l) => l.id === email.leadId)
    : leads.find((l) => l.contactEmail.toLowerCase() === peer.toLowerCase());
  if (lead) return lead.contactName;
  const contact = contacts.find(
    (c) => c.email.toLowerCase() === peer.toLowerCase()
  );
  if (contact) return contact.name;
  if (email.direction === "outbound") return "You";
  return titleCaseFromEmail(peer);
}

export function resolvePeerEmail(email: CrmEmail): string {
  return email.direction === "inbound" ? email.fromEmail : email.toEmail;
}

export function getInboxTag(
  email: CrmEmail,
  lead: CrmLead | undefined
): InboxTag {
  if (/invoice|payment|billing/i.test(email.subject)) return "finance";
  if (email.leadId && lead) return "lead";
  if (!email.leadId) return "unlinked";
  return "internal";
}

export function splitEmailBody(body: string): string[] {
  const plain = body
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|blockquote|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ");

  const trimmed = plain.trim();
  if (!trimmed) return [];
  const byPara = trimmed.split(/\n\n+/).filter(Boolean);
  if (byPara.length > 1) return byPara;
  return trimmed.split(/\n/).filter(Boolean);
}

export function suggestLeadForEmail(
  fromEmail: string,
  leads: CrmLead[]
): CrmLead | null {
  const lower = fromEmail.toLowerCase();
  const exact = leads.find((l) => l.contactEmail.toLowerCase() === lower);
  if (exact) return exact;
  const domain = lower.split("@")[1];
  if (!domain) return null;
  const stem = domain.split(".")[0] ?? "";
  return (
    leads.find((l) => l.contactEmail.toLowerCase().includes(stem)) ?? null
  );
}
