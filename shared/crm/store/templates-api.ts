"use client";

import { apiGet, apiPut, type JsonResult } from "./api-client";
import type { EmailTemplate } from "./email-templates";

// Per-user email templates, persisted in Mongo (source of truth).
export async function getBackendEmailTemplates(): Promise<
  JsonResult<EmailTemplate[]>
> {
  return apiGet<EmailTemplate[]>("/v1/email/templates");
}

export async function saveBackendEmailTemplates(
  templates: EmailTemplate[]
): Promise<JsonResult<EmailTemplate[]>> {
  return apiPut<EmailTemplate[]>("/v1/email/templates", { templates });
}
