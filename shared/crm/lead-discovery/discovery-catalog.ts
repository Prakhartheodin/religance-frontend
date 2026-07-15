import type { BackendBuyerMaster } from "@/shared/crm/store/outlook-api";
import { getExcelBuyersForMedicine } from "@/shared/crm/lead-discovery/discovery-excel";
import type { DiscoveredCompany } from "@/shared/crm/lead-discovery/types";

export type DiscoveryMedicine = {
  id: string;
  saltIds: string[]; // a medicine can belong to more than one salt
  name: string;
  dosageForm: string;
};

export function getMedicinesForSalt(
  saltId: string,
  medicines: DiscoveryMedicine[] = []
): DiscoveryMedicine[] {
  return medicines.filter((m) => m.saltIds.includes(saltId));
}

export function getMedicinesForCheckedSalts(
  saltIds: string[],
  medicines: DiscoveryMedicine[] = []
): DiscoveryMedicine[] {
  // A medicine linked to two checked salts must appear once, not twice.
  const seen = new Set<string>();
  const list: DiscoveryMedicine[] = [];
  for (const saltId of saltIds) {
    for (const m of getMedicinesForSalt(saltId, medicines)) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      list.push(m);
    }
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/** Buyers come from MongoDB via /v1/master-data — no mock fallback. */
export function getCompaniesForMedicine(
  medicine: DiscoveryMedicine,
  saltName: string,
  excelBuyers: BackendBuyerMaster[] = []
): DiscoveredCompany[] {
  return getExcelBuyersForMedicine(medicine, saltName, excelBuyers);
}
