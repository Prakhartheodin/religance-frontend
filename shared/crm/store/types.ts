import type { EmailTemplate } from "./email-templates";
import type { DiscoveryMedicine } from "./medicines-master";
import type { SaltMasterItem } from "./salts-master";

export type LeadStage =
  | "Saved"
  | "Verified"
  | "Intro Email Sent"
  | "Follow-up Sent"
  | "Replied"
  | "Sample Requested"
  | "Quotation Sent"
  | "Negotiation"
  | "Won"
  | "Lost"
  | "Dormant";

export type SaveToContactOption =
  | "company_only"
  | "company_and_contact"
  | "create_lead"
  | "create_lead_and_email";

export type CrmCompany = {
  id: string;
  name: string;
  location: string;
  website: string;
  companyType: string;
  certification: string;
  discoveryCompanyId?: string;
  sourceLinks: { label: string; url: string }[];
  createdAt: string;
};

export type CrmContact = {
  id: string;
  companyId: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  createdAt: string;
};

export type CrmLead = {
  id: string;
  title: string;
  companyId: string;
  contactId: string | null;
  discoveryCompanyId?: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  matchedSalt: string;
  matchedMedicine: string;
  dosageForm: string;
  location: string;
  stage: LeadStage;
  leadScore: number;
  assignedTo: string;
  followUpDate: string;
  lastActivity: string;
  notes: string;
  createdAt: string;
  sourceLinks: { label: string; url: string }[];
};

export type CrmDeal = {
  id: string;
  leadId: string;
  title: string;
  companyName: string;
  value: string;
  stage: "Open" | "Won" | "Lost";
  createdAt: string;
};

export type CrmEmailAttachment = {
  filename: string;
  mimeType: string;
  size: number;
  /** Both required to download; absent on locally composed mail. */
  attachmentId?: string;
  messageId?: string;
};

export type CrmEmail = {
  id: string;
  leadId: string | null;
  threadId: string;
  /** Latest Graph message id in the thread — used for reply/forward APIs. */
  messageId?: string | null;
  direction: "inbound" | "outbound";
  mailboxLabels?: string[];
  /** Graph message importance — used for Important folder (distinct from starred). */
  importance?: "low" | "normal" | "high";
  /** Outlook category names from Graph `categories` on synced messages. */
  outlookCategories?: string[];
  subject: string;
  body: string;
  preview: string;
  fromEmail: string;
  toEmail: string;
  sentAt: string;
  attachments?: CrmEmailAttachment[];
};

/**
 * CRM-owned overlay on a mail item. Graph owns the email itself (subject, body,
 * sender); these are the bits the user creates here and would otherwise lose on
 * every re-sync — the lead link and the folder/star flags. Keyed by CrmEmail.id.
 */
export type CrmEmailMeta = {
  id: string;
  leadId: string | null;
  starred: boolean;
  read: boolean;
  archived: boolean;
  trashed: boolean;
};

export type EmailFlag = "starred" | "read" | "archived" | "trashed";

export type CrmTimelineEvent = {
  id: string;
  leadId: string;
  date: string;
  title: string;
  description: string;
  type: "stage" | "email" | "note" | "call" | "verification" | "deal";
  /** Links email timeline events to inbox threads for deep navigation. */
  emailId?: string;
};

export type OutlookMailboxAccount = {
  id: string;
  provider: "outlook";
  email: string;
  displayName?: string | null;
  status: "active" | "revoked" | "error";
  createdAt: string;
};

export type CrmState = {
  companies: CrmCompany[];
  contacts: CrmContact[];
  leads: CrmLead[];
  deals: CrmDeal[];
  emails: CrmEmail[];
  /** Persisted overlay for `emails` (which are re-fetched from Graph, not stored). */
  emailMeta: CrmEmailMeta[];
  timeline: CrmTimelineEvent[];
  gmailConnected: boolean;
  outlookAccountId?: string | null;
  outlookEmail?: string | null;
  outlookAccounts?: OutlookMailboxAccount[];
  emailTemplates: EmailTemplate[];
  salts: SaltMasterItem[];
  medicines: DiscoveryMedicine[];
};

export const DEFAULT_ASSIGNEES = ["Priya Sharma", "Arjun Nair"] as const;

export const CURRENT_USER = DEFAULT_ASSIGNEES[0];
