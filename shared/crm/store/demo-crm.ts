import type { CrmLead } from "./types";

/** Legacy demo seed contacts are identifiable by their *.example.com addresses. */
export function isDemoCrmLead(lead: CrmLead): boolean {
  return lead.contactEmail.toLowerCase().includes(".example.com");
}

export function isDemoCrmLeads(leads: CrmLead[]): boolean {
  return leads.length > 0 && leads.every(isDemoCrmLead);
}
