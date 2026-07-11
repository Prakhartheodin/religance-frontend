"use client";

import { apiGet, apiPut, type JsonResult } from "./api-client";
import type { CrmLead } from "./types";

// Per-user pipeline leads, persisted in Mongo (source of truth).
export async function getBackendLeads(): Promise<JsonResult<CrmLead[]>> {
  return apiGet<CrmLead[]>("/v1/crm/leads");
}

export async function saveBackendLeads(
  leads: CrmLead[]
): Promise<JsonResult<CrmLead[]>> {
  return apiPut<CrmLead[]>("/v1/crm/leads", { items: leads });
}
