import type { CompanyProfileDetail } from "@/shared/crm/lead-discovery/company-profile-types";
import type { LeadStage, SaveToContactOption } from "./types";
import { getNextLeadStage } from "@/shared/crm/active-leads/lead-stages";

export { getNextLeadStage };

export function generateCrmId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function followUpInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildLeadTitle(
  profile: CompanyProfileDetail,
  companyName: string
): string {
  return `${profile.matchedMedicine} — ${companyName}`;
}

/** Stage after sending first outreach email. */
export function stageAfterSendEmail(current: LeadStage): LeadStage {
  if (current === "Saved" || current === "Verified") return "Intro Email Sent";
  if (current === "Intro Email Sent") return "Follow-up Sent";
  return current;
}

export function optionCreatesLead(option: SaveToContactOption): boolean {
  return option === "create_lead" || option === "create_lead_and_email";
}

export function optionCreatesContact(option: SaveToContactOption): boolean {
  return option === "company_and_contact" || optionCreatesLead(option);
}

export function primaryContactFromProfile(profile: CompanyProfileDetail) {
  return profile.contacts[0] ?? {
    name: "Commercial contact",
    role: "Business Development",
    email: `contact@${profile.companyName.toLowerCase().replace(/\s+/g, "")}.example.com`,
  };
}
