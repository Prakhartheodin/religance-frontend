"use client";

import { apiGet, apiPut, type JsonResult } from "./api-client";
import type { CrmContact } from "./types";

// Per-user contacts, persisted in Mongo (source of truth).
export async function getBackendContacts(): Promise<JsonResult<CrmContact[]>> {
  return apiGet<CrmContact[]>("/v1/crm/contacts");
}

export async function saveBackendContacts(
  contacts: CrmContact[],
  baseIds: string[]
): Promise<JsonResult<CrmContact[]>> {
  return apiPut<CrmContact[]>("/v1/crm/contacts", { items: contacts, baseIds });
}
