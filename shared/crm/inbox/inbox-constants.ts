import type { InboxTag } from "./inbox-utils";

// `badge` is spelled out on every folder (undefined where there is none) so the
// union stays uniform and `folder.badge` type-checks at the call site.
export const INBOX_FOLDERS = [
  { name: "All Mails", icon: "ri-mail-line", badge: "purple" as const },
  { name: "Inbox", icon: "ri-inbox-line", badge: "purple-soft" as const },
  { name: "Sent", icon: "ri-send-plane-line", badge: undefined },
  { name: "Drafts", icon: "ri-draft-line", badge: undefined },
  { name: "Spam", icon: "ri-spam-2-line", badge: "danger" as const },
  { name: "Important", icon: "ri-flag-line", badge: "warning" as const },
  { name: "Trash", icon: "ri-delete-bin-line", badge: undefined },
  { name: "Archive", icon: "ri-archive-line", badge: undefined },
  { name: "Starred", icon: "ri-star-line", badge: "warning" as const },
] as const;

export type InboxFolderName = (typeof INBOX_FOLDERS)[number]["name"];

export const INBOX_LABELS: {
  name: InboxTag;
  label: string;
  bagClass: string;
}[] = [
  { name: "finance", label: "Mall", bagClass: "bag-blue" },
  { name: "internal", label: "Home", bagClass: "bag-red" },
  { name: "lead", label: "Work", bagClass: "bag-green" },
  { name: "unlinked", label: "Friends", bagClass: "bag-yellow" },
];

export const REPLY_TOOLBAR_GROUPS = [
  {
    type: "select" as const,
    options: ["Normal", "Heading", "Subheading"],
  },
  {
    type: "select" as const,
    options: ["Sans Serif", "Serif", "Mono"],
  },
  {
    type: "icons" as const,
    icons: [
      "ri-bold",
      "ri-italic",
      "ri-underline",
      "ri-strikethrough",
      "ri-double-quotes-l",
      "ri-code-s-slash-line",
      "ri-h-1",
      "ri-h-2",
      "ri-list-unordered",
      "ri-list-ordered",
      "ri-align-left",
      "ri-link",
      "ri-image-line",
    ],
  },
] as const;
