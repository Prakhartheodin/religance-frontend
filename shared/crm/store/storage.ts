import { createInitialCrmState } from "./seed";
import type { CrmState } from "./types";
import { stripDemoCrmEntities } from "./demo-crm";
import { getDefaultEmailTemplate } from "./email-templates";
import { getDefaultMedicine } from "./medicines-master";
import { getDefaultSalt } from "./salts-master";

const STORAGE_KEY = "religence-crm-v1";

export function loadCrmState(): CrmState {
  if (typeof window === "undefined") {
    return createInitialCrmState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialCrmState();
    const parsed = JSON.parse(raw) as CrmState;
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
    // Old demo sessions marked connected without a real Outlook account id.
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
  } catch {
    return createInitialCrmState();
  }
}

export function saveCrmState(state: CrmState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function resetCrmState(): CrmState {
  const fresh = createInitialCrmState();
  saveCrmState(fresh);
  return fresh;
}
