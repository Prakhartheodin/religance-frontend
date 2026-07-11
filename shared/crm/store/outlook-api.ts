"use client";

import { getToken } from "@/shared/auth/auth-client";
import type { DiscoveryMedicine } from "./medicines-master";
import type { SaltMasterItem } from "./salts-master";
import type { EmailTemplate } from "./email-templates";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_RELIGENCE_BACKEND_URL ?? "http://localhost:4000";
const REQUEST_TIMEOUT_MS = 12000;

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken() ?? ""}`,
  };
}

export type OutlookAccount = {
  id: string;
  provider: "outlook";
  email: string;
  displayName?: string | null;
  status: "active" | "revoked" | "error";
  createdAt: string;
};

export type OutlookThreadItem = {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string | null;
  labelIds?: string[];
  isUnread: boolean;
};

export type OutlookThread = {
  id: string;
  messages: Array<{
    id: string;
    threadId?: string;
    snippet: string;
    from: string;
    to: string;
    subject: string;
    date: string | null;
    htmlBody: string | null;
    textBody: string | null;
  }>;
};

type JsonResult<T> = { live: true; data: T } | { live: false; error: string };

async function fetchWithTimeout(
  input: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

function normalizeFetchError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Request timed out. Please try again.";
  }
  return err instanceof Error ? err.message : "Network request failed";
}

async function getJson<T>(path: string): Promise<JsonResult<T>> {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}${path}`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { error?: string }).error ?? `Request failed (${res.status})`;
      return { live: false, error: message };
    }
    const data = (await res.json()) as T;
    return { live: true, data };
  } catch (err) {
    return {
      live: false,
      error: normalizeFetchError(err),
    };
  }
}

async function postJson<T>(
  path: string,
  payload: unknown,
  method: "POST" | "PATCH" | "DELETE" = "POST"
): Promise<JsonResult<T>> {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}${path}`, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { error?: string }).error ?? `Request failed (${res.status})`;
      return { live: false, error: message };
    }
    if (res.status === 204) {
      return { live: true, data: undefined as T };
    }
    const data = (await res.json()) as T;
    return { live: true, data };
  } catch (err) {
    return {
      live: false,
      error: normalizeFetchError(err),
    };
  }
}

async function putJson<T>(path: string, payload: unknown): Promise<JsonResult<T>> {
  try {
    const res = await fetchWithTimeout(`${BACKEND_BASE}${path}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { error?: string }).error ?? `Request failed (${res.status})`;
      return { live: false, error: message };
    }
    const data = (await res.json()) as T;
    return { live: true, data };
  } catch (err) {
    return {
      live: false,
      error: normalizeFetchError(err),
    };
  }
}

export async function fetchOutlookConnectUrl(): Promise<JsonResult<{ url: string }>> {
  return getJson<{ url: string }>("/v1/email/auth/microsoft");
}

export async function listOutlookAccounts(): Promise<JsonResult<OutlookAccount[]>> {
  return getJson<OutlookAccount[]>("/v1/email/accounts");
}

export async function disconnectOutlookAccount(
  accountId: string
): Promise<JsonResult<{ success: boolean }>> {
  return postJson<{ success: boolean }>(
    `/v1/email/accounts/${encodeURIComponent(accountId)}`,
    {},
    "DELETE"
  );
}

export async function listOutlookThreads(
  accountId: string,
  pageSize = 20,
  labelId?: string
): Promise<JsonResult<{ threads: OutlookThreadItem[]; nextPageToken: string | null }>> {
  const params = new URLSearchParams({
    accountId,
    pageSize: String(pageSize),
  });
  if (labelId?.trim()) {
    params.set("labelId", labelId.trim());
  }
  const qs = params.toString();
  return getJson<{ threads: OutlookThreadItem[]; nextPageToken: string | null }>(
    `/v1/email/threads?${qs}`
  );
}

export async function getOutlookThread(
  accountId: string,
  threadId: string
): Promise<JsonResult<OutlookThread>> {
  const qs = new URLSearchParams({ accountId }).toString();
  return getJson<OutlookThread>(
    `/v1/email/threads/${encodeURIComponent(threadId)}?${qs}`
  );
}

export async function sendOutlookMessage(input: {
  accountId: string;
  to: string;
  subject: string;
  html: string;
}): Promise<JsonResult<{ id: string | null; threadId?: string | null }>> {
  return postJson<{ id: string | null; threadId?: string | null }>(
    "/v1/email/messages/send",
    input,
    "POST"
  );
}

export async function listBackendEmailTemplates(): Promise<JsonResult<EmailTemplate[]>> {
  return getJson<EmailTemplate[]>("/v1/email/templates");
}

export async function saveBackendEmailTemplates(
  templates: EmailTemplate[]
): Promise<JsonResult<EmailTemplate[]>> {
  return putJson<EmailTemplate[]>("/v1/email/templates", { templates });
}

export type BackendSaltMaster = {
  id: string;
  name: string;
  casNumbers: string[];
  sourceFiles: string[];
  buyerCount: number;
  totalAnnualBuyingCapacityKg: number;
  companyCategories: string[];
  countries: string[];
  certifications: string[];
};

export type BackendMedicineMaster = {
  id: string;
  saltId: string;
  name: string;
  dosageForm: string;
  casNumber: string | null;
  sourceFiles: string[];
  buyerCount: number;
  totalAnnualBuyingCapacityKg: number;
};

export type BackendBuyerMaster = {
  id: string;
  medicineId: string;
  saltId: string;
  productName: string;
  casNo: string | null;
  buyerName: string;
  companyCategory: string | null;
  certifications: string[];
  annualBuyingCapacityKg: number | null;
  contactPersons: string[];
  designations: string[];
  emails: string[];
  phoneNumbers: string[];
  country: string | null;
  sourceFile: string;
  sourceRow: number;
};

export type BackendMasterData = {
  generatedAt: string;
  sourceDirectory: string;
  sourceFiles: string[];
  salts: BackendSaltMaster[];
  medicines: BackendMedicineMaster[];
  buyers: BackendBuyerMaster[];
};

export async function listBackendMasterData(
  reload = false
): Promise<JsonResult<BackendMasterData>> {
  const query = reload ? "?reload=true" : "";
  return getJson<BackendMasterData>(`/v1/master-data${query}`);
}

// Per-user Salts / Medicines master, persisted in Mongo (source of truth).
export async function getBackendSalts(): Promise<JsonResult<SaltMasterItem[]>> {
  return getJson<SaltMasterItem[]>("/v1/master-data/salts");
}

export async function saveBackendSalts(
  salts: SaltMasterItem[]
): Promise<JsonResult<SaltMasterItem[]>> {
  return putJson<SaltMasterItem[]>("/v1/master-data/salts", { items: salts });
}

export async function getBackendMedicines(): Promise<JsonResult<DiscoveryMedicine[]>> {
  return getJson<DiscoveryMedicine[]>("/v1/master-data/medicines");
}

export async function saveBackendMedicines(
  medicines: DiscoveryMedicine[]
): Promise<JsonResult<DiscoveryMedicine[]>> {
  return putJson<DiscoveryMedicine[]>("/v1/master-data/medicines", {
    items: medicines,
  });
}
