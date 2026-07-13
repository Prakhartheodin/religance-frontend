import type { CrmState } from "./types";
import { cloneDefaultEmailTemplates } from "./email-templates";
import { cloneDefaultMedicines } from "./medicines-master";
import { cloneDefaultSalts } from "./salts-master";

/** Empty CRM — real data comes from Mongo + Outlook after user activity. */
export function createInitialCrmState(): CrmState {
  return {
    companies: [],
    contacts: [],
    leads: [],
    deals: [],
    emails: [],
    emailMeta: [],
    timeline: [],
    gmailConnected: false,
    outlookAccountId: null,
    outlookEmail: null,
    outlookAccounts: [],
    emailTemplates: cloneDefaultEmailTemplates(),
    salts: cloneDefaultSalts(),
    medicines: cloneDefaultMedicines(),
  };
}
