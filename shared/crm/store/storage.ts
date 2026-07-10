import { createInitialCrmState } from "./seed";
import type { CrmState } from "./types";
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
    return parsed;
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
