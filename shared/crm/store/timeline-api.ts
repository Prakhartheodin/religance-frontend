"use client";

import { apiGet, apiPut, type JsonResult } from "./api-client";
import type { CrmTimelineEvent } from "./types";

// Per-user CRM timeline events, persisted in Mongo (source of truth).
export async function getBackendTimeline(): Promise<JsonResult<CrmTimelineEvent[]>> {
  return apiGet<CrmTimelineEvent[]>("/v1/crm/timeline");
}

export async function saveBackendTimeline(
  timeline: CrmTimelineEvent[]
): Promise<JsonResult<CrmTimelineEvent[]>> {
  return apiPut<CrmTimelineEvent[]>("/v1/crm/timeline", { items: timeline });
}
