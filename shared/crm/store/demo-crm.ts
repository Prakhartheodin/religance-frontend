import type { CrmLead, CrmState } from "./types";

/** Demo seed contacts use *.example.com addresses from mock-leads. */
export function isDemoCrmLead(lead: CrmLead): boolean {
  return lead.contactEmail.toLowerCase().includes(".example.com");
}

export function isDemoCrmLeads(leads: CrmLead[]): boolean {
  return leads.length > 0 && leads.every(isDemoCrmLead);
}

export function stripDemoCrmEntities(state: CrmState): CrmState {
  if (!isDemoCrmLeads(state.leads)) return state;
  return {
    ...state,
    companies: [],
    contacts: [],
    leads: [],
    deals: [],
    timeline: [],
    emails: [],
  };
}
