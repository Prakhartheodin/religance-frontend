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

/** Buyers for all checked medicines under the checked salts (deduped). */
export function getCompaniesForCheckedMedicines(
  checkedSaltIds: string[],
  checkedMedicineIds: string[],
  medicines: DiscoveryMedicine[],
  salts: { id: string; name: string }[],
  excelBuyers: BackendBuyerMaster[] = []
): DiscoveredCompany[] {
  if (!checkedSaltIds.length || !checkedMedicineIds.length) return [];

  const selected = medicines.filter((m) => checkedMedicineIds.includes(m.id));
  const seen = new Set<string>();
  const rows: DiscoveredCompany[] = [];

  for (const medicine of selected) {
    const salt =
      salts.find(
        (s) =>
          checkedSaltIds.includes(s.id) && medicine.saltIds.includes(s.id)
      ) ?? salts.find((s) => medicine.saltIds.includes(s.id));
    if (!salt) continue;

    for (const company of getExcelBuyersForMedicine(
      medicine,
      salt.name,
      excelBuyers
    )) {
      if (seen.has(company.id)) continue;
      seen.add(company.id);
      rows.push(company);
    }
  }

  return rows.sort((a, b) => b.leadScore - a.leadScore);
}

/** Buyers for a single medicine (catalogue rows). */
export function getCompaniesForMedicine(
  medicine: DiscoveryMedicine,
  saltName: string,
  excelBuyers: BackendBuyerMaster[] = []
): DiscoveredCompany[] {
  return getExcelBuyersForMedicine(medicine, saltName, excelBuyers);
}
