"use client";

import { getToken } from "@/shared/auth/auth-client";

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
    importance?: string;
    inferenceClassification?: string;
    categories?: string[];
    isDraft?: boolean;
    attachments?: Array<{
      filename: string;
      mimeType: string;
      size: number;
      attachmentId?: string;
      messageId?: string;
    }>;
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
  labelId?: string,
  pageToken?: string
): Promise<JsonResult<{ threads: OutlookThreadItem[]; nextPageToken: string | null }>> {
  const params = new URLSearchParams({
    accountId,
    pageSize: String(pageSize),
  });
  if (labelId?.trim()) {
    params.set("labelId", labelId.trim());
  }
  if (pageToken?.trim()) {
    params.set("pageToken", pageToken.trim());
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

export async function replyOutlookMessage(input: {
  accountId: string;
  messageId: string;
  html: string;
}): Promise<JsonResult<{ id: string | null; threadId?: string | null }>> {
  return postJson(
    `/v1/email/messages/${encodeURIComponent(input.messageId)}/reply`,
    { accountId: input.accountId, html: input.html }
  );
}

export async function replyAllOutlookMessage(input: {
  accountId: string;
  messageId: string;
  html: string;
}): Promise<JsonResult<{ id: string | null; threadId?: string | null }>> {
  return postJson(
    `/v1/email/messages/${encodeURIComponent(input.messageId)}/reply-all`,
    { accountId: input.accountId, html: input.html }
  );
}

export async function forwardOutlookMessage(input: {
  accountId: string;
  messageId: string;
  to: string;
  html: string;
}): Promise<JsonResult<{ id: string | null; threadId?: string | null }>> {
  return postJson(
    `/v1/email/messages/${encodeURIComponent(input.messageId)}/forward`,
    { accountId: input.accountId, to: input.to, html: input.html }
  );
}

export async function batchModifyOutlookThreads(input: {
  accountId: string;
  threadIds: string[];
  addLabelIds?: string[];
  removeLabelIds?: string[];
}): Promise<JsonResult<{ success: boolean; modified: number }>> {
  return postJson("/v1/email/threads/batch-modify", input);
}

export async function trashOutlookThreads(input: {
  accountId: string;
  threadIds: string[];
}): Promise<JsonResult<{ success: boolean }>> {
  return postJson("/v1/email/threads/trash", input);
}

/**
 * Fetches the attachment with the auth header (a plain <a href> can't send
 * one) and hands it to the browser as a download. Returns an error message
 * or null. No request timeout — large attachments legitimately take a while.
 */
export async function downloadOutlookAttachment(input: {
  accountId: string;
  messageId: string;
  attachmentId: string;
  filename: string;
}): Promise<string | null> {
  try {
    const qs = new URLSearchParams({ accountId: input.accountId }).toString();
    const res = await fetch(
      `${BACKEND_BASE}/v1/email/messages/${encodeURIComponent(
        input.messageId
      )}/attachments/${encodeURIComponent(input.attachmentId)}?${qs}`,
      { headers: authHeaders(), cache: "no-store" }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return (
        (body as { error?: string }).error ?? `Download failed (${res.status})`
      );
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = input.filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Download failed";
  }
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

export type BuyerImportResult = {
  sourceFile: string;
  buyers: number;
  buyersNew: number;
  salts: number;
  medicines: number;
};

/**
 * Upload one buyer-master workbook (the shape of the files in /Excel). The
 * backend parses it into buyers + derived salts + medicines and upserts all
 * three. Body is the raw file bytes; filename rides in the query string.
 */
export async function importBuyerExcel(
  file: File
): Promise<JsonResult<BuyerImportResult>> {
  try {
    const res = await fetchWithTimeout(
      `${BACKEND_BASE}/v1/master-data/import?filename=${encodeURIComponent(
        file.name
      )}`,
      {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/octet-stream",
        },
        body: await file.arrayBuffer(),
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { error?: string }).error ?? `Import failed (${res.status})`;
      return { live: false, error: message };
    }
    return { live: true, data: (await res.json()) as BuyerImportResult };
  } catch (err) {
    return { live: false, error: normalizeFetchError(err) };
  }
}





