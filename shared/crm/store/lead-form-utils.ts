import type { CrmCompany, CrmLead } from "./types";
import type { DiscoveryMedicine } from "./medicines-master";
import type { SaltMasterItem } from "./salts-master";

export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export function findCompanyByNormalizedName(
  companies: CrmCompany[],
  name: string
): CrmCompany | undefined {
  const key = normalizeName(name);
  return companies.find((c) => normalizeName(c.name) === key);
}

export function findDuplicateLead(
  leads: CrmLead[],
  companyId: string,
  medicineId: string,
  matchedMedicine: string,
  excludeLeadId?: string
): CrmLead | undefined {
  const medKey = normalizeName(matchedMedicine);
  return leads.find(
    (l) =>
      l.id !== excludeLeadId &&
      l.companyId === companyId &&
      (l.medicineId === medicineId ||
        normalizeName(l.matchedMedicine) === medKey)
  );
}

export function validateSaltMedicinePair(
  saltId: string,
  medicineId: string,
  salts: SaltMasterItem[],
  medicines: DiscoveryMedicine[]
): string | null {
  if (!saltId) return "Select a salt.";
  if (!medicineId) return "Select a medicine.";
  const medicine = medicines.find((m) => m.id === medicineId);
  if (!medicine) return "Select a medicine.";
  if (!medicine.saltIds.includes(saltId)) {
    return "This salt is not linked to the selected medicine.";
  }
  const salt = salts.find((s) => s.id === saltId);
  if (!salt) return "Select a salt.";
  return null;
}

/** Single source for salt pre-fill — used by LeadFormPage (URL params) and Discovery handleNewLead. */
export function resolvePrefillSaltId(
  saltIdParam: string | null,
  medicine: DiscoveryMedicine | undefined
): string {
  if (!medicine) return saltIdParam ?? "";
  if (saltIdParam && medicine.saltIds.includes(saltIdParam)) return saltIdParam;
  return medicine.saltIds[0] ?? "";
}

/** Default salt when medicine is chosen but salt state lags (e.g. before effects run). */
export function resolveEffectiveSaltId(
  saltId: string,
  medicineId: string,
  medicines: DiscoveryMedicine[]
): string {
  if (saltId.trim()) return saltId;
  if (!medicineId) return "";
  const medicine = medicines.find((m) => m.id === medicineId);
  return medicine?.saltIds[0] ?? "";
}

/** Default title from company + medicine when user has not typed a custom title. */
export function resolveEffectiveLeadTitle(
  title: string,
  titleTouched: boolean,
  companyName: string,
  medicine: DiscoveryMedicine | undefined
): string {
  const trimmed = title.trim();
  if (trimmed) return trimmed;
  if (titleTouched || !companyName.trim() || !medicine) return "";
  return `${medicine.name} — ${companyName.trim()}`;
}
