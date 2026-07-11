"use client";

import { apiGet, apiPut, type JsonResult } from "./api-client";
import type { CrmDeal } from "./types";

// Per-user deals, persisted in Mongo (source of truth).
export async function getBackendDeals(): Promise<JsonResult<CrmDeal[]>> {
  return apiGet<CrmDeal[]>("/v1/crm/deals");
}

export async function saveBackendDeals(
  deals: CrmDeal[]
): Promise<JsonResult<CrmDeal[]>> {
  return apiPut<CrmDeal[]>("/v1/crm/deals", { items: deals });
}
