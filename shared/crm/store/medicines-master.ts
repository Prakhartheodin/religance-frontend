import type { DiscoveryMedicine } from "../lead-discovery/discovery-catalog";

export type { DiscoveryMedicine };

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

// Removed: DEFAULT_MEDICINES / cloneDefaultMedicines / getDefaultMedicine /
// isDefaultMedicine — the same dead stubs as in salts-master.ts.
