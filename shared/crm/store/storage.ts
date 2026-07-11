import { getUser } from "@/shared/auth/auth-client";
import { createInitialCrmState } from "./seed";
import type { CrmState } from "./types";
import { stripDemoCrmEntities } from "./demo-crm";
import { getDefaultEmailTemplate } from "./email-templates";
import { getDefaultMedicine } from "./medicines-master";
import { getDefaultSalt } from "./salts-master";

const STORAGE_PREFIX = "religence-crm-v1";
const LEGACY_STORAGE_KEY = "religence-crm-v1";

function storageKey(userId?: string | null): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : LEGACY_STORAGE_KEY;
}

function normalizeLoadedState(parsed: CrmState): CrmState {
  if (!parsed.leads || !parsed.companies) return createInitialCrmState();
  if (typeof parsed.outlookAccountId === "undefined") {
    parsed.outlookAccountId = null;
  }
  if (typeof parsed.outlookEmail === "undefined") {
    parsed.outlookEmail = null;
  }
  if (typeof parsed.outlookAccounts === "undefined") {
    parsed.outlookAccounts = [];
  }
  if (parsed.gmailConnected && !parsed.outlookAccountId) {
    parsed.gmailConnected = false;
  }
  if (
    parsed.outlookAccountId &&
    parsed.outlookEmail &&
    !parsed.outlookAccounts.some((a) => a.id === parsed.outlookAccountId)
  ) {
    parsed.outlookAccounts = [
      ...parsed.outlookAccounts,
      {
        id: parsed.outlookAccountId,
        provider: "outlook",
        email: parsed.outlookEmail,
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ];
  }
  if (!parsed.outlookAccountId) {
    parsed.emails = [];
    parsed.outlookAccounts = [];
  }
  if (!parsed.emailTemplates?.length) {
    parsed.emailTemplates = createInitialCrmState().emailTemplates;
  } else {
    parsed.emailTemplates = parsed.emailTemplates.map((t) => {
      const def = getDefaultEmailTemplate(t.id);
      return {
        ...def,
        ...t,
        category: t.category ?? def?.category ?? "introduction",
        description: t.description ?? def?.description ?? "",
      };
    });
  }
  if (!parsed.salts?.length) {
    parsed.salts = createInitialCrmState().salts;
  } else {
    parsed.salts = parsed.salts.map((s) => {
      const def = getDefaultSalt(s.id);
      return def ? { ...def, ...s } : s;
    });
  }
  if (!parsed.medicines?.length) {
    parsed.medicines = createInitialCrmState().medicines;
  } else {
    parsed.medicines = parsed.medicines.map((m) => {
      const def = getDefaultMedicine(m.id);
      return def ? { ...def, ...m } : m;
    });
  }
  return stripDemoCrmEntities(parsed);
}

export function loadCrmState(): CrmState {
  if (typeof window === "undefined") {
    return createInitialCrmState();
  }
  try {
    const userId = getUser()?.id ?? null;
    const key = storageKey(userId);
    let raw = localStorage.getItem(key);
    if (!raw && userId) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.setItem(key, legacy);
      }
    }
    if (!raw) return createInitialCrmState();
    const parsed = JSON.parse(raw) as CrmState;
    return normalizeLoadedState(parsed);
  } catch {
    return createInitialCrmState();
  }
}

export function saveCrmState(state: CrmState): void {
  if (typeof window === "undefined") return;
  try {
    const userId = getUser()?.id ?? null;
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function resetCrmState(): CrmState {
  const fresh = createInitialCrmState();
  saveCrmState(fresh);
  return fresh;
}

/** Drop cached Outlook mailbox state for the active JWT user. */
export function clearOutlookCache(): CrmState {
  const next = loadCrmState();
  next.gmailConnected = false;
  next.outlookAccountId = null;
  next.outlookEmail = null;
  next.outlookAccounts = [];
  next.emails = [];
  saveCrmState(next);
  return next;
}
