"use client";

import { apiGet, apiPut, type JsonResult } from "./api-client";
import type { CrmQuotation } from "./types";

export async function getBackendQuotations(): Promise<JsonResult<CrmQuotation[]>> {
  return apiGet<CrmQuotation[]>("/v1/crm/quotations");
}

export async function saveBackendQuotations(
  quotations: CrmQuotation[],
  baseIds: string[]
): Promise<JsonResult<CrmQuotation[]>> {
  return apiPut<CrmQuotation[]>("/v1/crm/quotations", {
    items: quotations,
    baseIds,
  });
}
