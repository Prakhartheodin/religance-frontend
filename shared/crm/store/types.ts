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

export type CrmEmail = {
  id: string;
  leadId: string | null;
  threadId: string;
  direction: "inbound" | "outbound";
  mailboxLabels?: string[];
  subject: string;
  body: string;
  preview: string;
  fromEmail: string;
  toEmail: string;
  sentAt: string;
};

export type CrmTimelineEvent = {
  id: string;
  leadId: string;
  date: string;
  title: string;
  description: string;
  type: "stage" | "email" | "note" | "call" | "verification" | "deal";
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
