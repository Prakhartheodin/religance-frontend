import type { DiscoveryMedicine } from "../lead-discovery/discovery-catalog";

export type { DiscoveryMedicine };

/** Medicines are loaded from Excel via /v1/master-data — no static defaults. */
export const DEFAULT_MEDICINES: DiscoveryMedicine[] = [];

export const DOSAGE_FORM_OPTIONS = [
  "API",
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Inhaler",
  "Respules",
  "Cream",
  "Ointment",
  "Nasal Spray",
  "Drops",
] as const;

export function cloneDefaultMedicines(): DiscoveryMedicine[] {
  return [];
}

export function getDefaultMedicine(_id: string): DiscoveryMedicine | undefined {
  return undefined;
}

export function isDefaultMedicine(_id: string): boolean {
  return false;
}

export function createBlankMedicine(
  id: string,
  saltId: string
): DiscoveryMedicine {
  return {
    id,
    saltId,
    name: "Untitled medicine",
    dosageForm: "API",
  };
}
