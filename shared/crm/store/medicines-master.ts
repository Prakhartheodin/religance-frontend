import {
  DISCOVERY_MEDICINES,
  type DiscoveryMedicine,
} from "../lead-discovery/discovery-catalog";

export type { DiscoveryMedicine };

export const DEFAULT_MEDICINES: DiscoveryMedicine[] = DISCOVERY_MEDICINES;

export const DOSAGE_FORM_OPTIONS = [
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
  return DISCOVERY_MEDICINES.map((m) => ({ ...m }));
}

export function getDefaultMedicine(id: string): DiscoveryMedicine | undefined {
  return DISCOVERY_MEDICINES.find((m) => m.id === id);
}

export function isDefaultMedicine(id: string): boolean {
  return DISCOVERY_MEDICINES.some((m) => m.id === id);
}

export function createBlankMedicine(
  id: string,
  saltId: string
): DiscoveryMedicine {
  return {
    id,
    saltId,
    name: "Untitled medicine",
    dosageForm: "Tablet",
  };
}
