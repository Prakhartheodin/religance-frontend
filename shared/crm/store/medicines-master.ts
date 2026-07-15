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

/**
 * Coerce a medicine from any source into the saltIds[] shape. Pre-migration rows
 * (and any un-restarted backend) still send a single `saltId`; a row with neither
 * gets an empty array so the UI never reads `.map` of undefined.
 */
export function normalizeMedicine(m: DiscoveryMedicine): DiscoveryMedicine {
  if (Array.isArray(m.saltIds)) return m;
  const legacy = (m as { saltId?: string }).saltId;
  return { ...m, saltIds: legacy ? [legacy] : [] };
}

export function createBlankMedicine(
  id: string,
  saltId: string
): DiscoveryMedicine {
  return {
    id,
    saltIds: [saltId],
    name: "Untitled medicine",
    dosageForm: "API",
  };
}

// Removed: DEFAULT_MEDICINES / cloneDefaultMedicines / getDefaultMedicine /
// isDefaultMedicine — the same dead stubs as in salts-master.ts.
