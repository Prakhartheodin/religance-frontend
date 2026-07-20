import type { BackendBuyerMaster } from "@/shared/crm/store/outlook-api";
import { getExcelBuyersForMedicine } from "@/shared/crm/lead-discovery/discovery-excel";
import type { DiscoveredCompany } from "@/shared/crm/lead-discovery/types";
import { normalizeName } from "@/shared/crm/store/lead-form-utils";
import type { CrmCompany, CrmLead } from "@/shared/crm/store/types";

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

/** Discovery Results row id for a lead — must stay in sync with getCompaniesFromLeads. */
export function discoveredCompanyIdForLead(lead: CrmLead): string {
  return lead.discoveryCompanyId ?? `lead-company-${lead.companyId}`;
}

/** Medicine id for a Results row — prefer the row's matched medicine over the active tab. */
export function resolveMedicineIdForDiscoveredCompany(
  company: DiscoveredCompany,
  medicines: DiscoveryMedicine[],
  fallbackMedicineId?: string | null
): string | null {
  const byName = medicines.find(
    (m) => normalizeName(m.name) === normalizeName(company.matchedMedicine)
  );
  if (byName) return byName.id;
  return fallbackMedicineId ?? null;
}

function pickLeadByMedicine(
  matches: CrmLead[],
  opts?: { medicineId?: string | null; matchedMedicine?: string }
): CrmLead | undefined {
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  const med = opts?.medicineId;
  if (med) {
    const byMed = matches.find((l) => l.medicineId === med);
    if (byMed) return byMed;
  }

  const medKey = normalizeName(opts?.matchedMedicine ?? "");
  if (medKey) {
    const byName = matches.find(
      (l) => normalizeName(l.matchedMedicine) === medKey
    );
    if (byName) return byName;
  }

  return matches[0];
}

/** Resolve the CRM lead backing a Discovery Results row (company + optional medicine). */
export function findLeadForDiscoveredCompany(
  leads: CrmLead[],
  company: DiscoveredCompany,
  opts?: { medicineId?: string | null; matchedMedicine?: string }
): CrmLead | undefined {
  const idMatches = leads.filter(
    (lead) => discoveredCompanyIdForLead(lead) === company.id
  );
  const byId = pickLeadByMedicine(idMatches, opts);
  if (byId) return byId;

  // Catalogue row opened while a manual lead exists for the same company + medicine.
  const nameKey = normalizeName(company.companyName);
  const medKey = normalizeName(company.matchedMedicine);
  const nameMatches = leads.filter((lead) => {
    if (normalizeName(lead.companyName) !== nameKey) return false;
    if (opts?.medicineId && lead.medicineId === opts.medicineId) return true;
    return normalizeName(lead.matchedMedicine) === medKey;
  });
  return pickLeadByMedicine(nameMatches, opts);
}

/**
 * DiscoveredCompany rows for leads the user created, so a lead made from the
 * "New Lead" button shows up in Discovery Results too — not only in Active
 * Leads. Only leads whose medicine is currently checked are returned; multiple
 * leads for the same company collapse to one row (highest score wins).
 */
export function getCompaniesFromLeads(
  checkedMedicineIds: string[],
  leads: CrmLead[],
  companies: CrmCompany[]
): DiscoveredCompany[] {
  if (!checkedMedicineIds.length) return [];
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const byCompany = new Map<string, DiscoveredCompany>();

  for (const lead of leads) {
    if (!lead.medicineId || !checkedMedicineIds.includes(lead.medicineId)) {
      continue;
    }
    const company = companyById.get(lead.companyId);
    const row: DiscoveredCompany = {
      // Reuse the catalogue buyer id when the lead came from one, so it dedupes
      // against the catalogue row instead of showing twice.
      id: discoveredCompanyIdForLead(lead),
      companyName: lead.companyName,
      matchedSalt: lead.matchedSalt,
      matchedMedicine: lead.matchedMedicine,
      dosageForm: lead.dosageForm,
      companyType: company?.companyType ?? "",
      location: lead.location || company?.location || "",
      category: "",
      certification: company?.certification ?? "",
      leadScore: lead.leadScore,
      sourceProof: "Created lead",
      matchReasons: ["Created lead"],
      contactPersons: lead.contactName ? [lead.contactName] : [],
      designations: lead.contactRole ? [lead.contactRole] : [],
      emails: lead.contactEmail ? [lead.contactEmail] : [],
      phoneNumbers: [],
    };
    const existing = byCompany.get(row.id);
    if (!existing || row.leadScore > existing.leadScore) {
      byCompany.set(row.id, row);
    }
  }

  return [...byCompany.values()];
}

/** Buyers for a single medicine (catalogue rows). */
export function getCompaniesForMedicine(
  medicine: DiscoveryMedicine,
  saltName: string,
  excelBuyers: BackendBuyerMaster[] = []
): DiscoveredCompany[] {
  return getExcelBuyersForMedicine(medicine, saltName, excelBuyers);
}
