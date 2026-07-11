import type { BackendBuyerMaster } from "@/shared/crm/store/outlook-api";
import { getExcelBuyersForMedicine } from "@/shared/crm/lead-discovery/discovery-excel";
import type { DiscoveredCompany } from "@/shared/crm/lead-discovery/types";

export type DiscoveryMedicine = {
  id: string;
  saltId: string;
  name: string;
  dosageForm: string;
};

export function getMedicinesForSalt(
  saltId: string,
  medicines: DiscoveryMedicine[] = []
): DiscoveryMedicine[] {
  return medicines.filter((m) => m.saltId === saltId);
}

export function getMedicinesForCheckedSalts(
  saltIds: string[],
  medicines: DiscoveryMedicine[] = []
): DiscoveryMedicine[] {
  const list: DiscoveryMedicine[] = [];
  for (const saltId of saltIds) {
    list.push(...getMedicinesForSalt(saltId, medicines));
  }
  return list.sort((a, b) => {
    if (a.saltId !== b.saltId) {
      return a.saltId.localeCompare(b.saltId);
    }
    return a.name.localeCompare(b.name);
  });
}

/** Buyers come only from Excel via /v1/master-data — no mock fallback. */
export function getCompaniesForMedicine(
  medicine: DiscoveryMedicine,
  saltName: string,
  excelBuyers: BackendBuyerMaster[] = []
): DiscoveredCompany[] {
  return getExcelBuyersForMedicine(medicine, saltName, excelBuyers);
}
