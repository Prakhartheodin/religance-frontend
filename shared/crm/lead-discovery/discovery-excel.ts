import type { BackendBuyerMaster } from "@/shared/crm/store/outlook-api";
import type { DiscoveryMedicine } from "@/shared/crm/lead-discovery/discovery-catalog";
import type { DiscoveredCompany } from "@/shared/crm/lead-discovery/types";

function leadScoreFromCapacity(kg: number | null): number {
  if (kg === null || kg <= 0) return 45;
  if (kg >= 100) return 88;
  if (kg >= 50) return 78;
  if (kg >= 10) return 68;
  if (kg >= 1) return 58;
  return 50;
}

export function buyerToDiscoveredCompany(
  buyer: BackendBuyerMaster,
  medicine: DiscoveryMedicine,
  saltName: string
): DiscoveredCompany {
  const certifications = buyer.certifications.length
    ? buyer.certifications.join(", ")
    : "—";

  return {
    id: buyer.id,
    companyName: buyer.buyerName,
    matchedSalt: saltName,
    matchedMedicine: medicine.name,
    dosageForm: medicine.dosageForm,
    companyType: buyer.companyCategory ?? "Buyer",
    location: buyer.country ?? "—",
    category: buyer.companyCategory ?? "Pharma",
    certification: certifications,
    leadScore: leadScoreFromCapacity(buyer.annualBuyingCapacityKg),
    sourceProof: buyer.sourceFile,
    matchReasons: [
      `Buyer for ${buyer.productName} from ${buyer.sourceFile}`,
      buyer.annualBuyingCapacityKg
        ? `Annual buying capacity: ${buyer.annualBuyingCapacityKg} kg`
        : "Capacity not specified in source sheet",
    ],
    annualBuyingCapacityKg: buyer.annualBuyingCapacityKg,
    contactPersons: buyer.contactPersons,
    designations: buyer.designations,
    emails: buyer.emails,
    phoneNumbers: buyer.phoneNumbers,
    casNo: buyer.casNo,
    sourceFile: buyer.sourceFile,
    sourceRow: buyer.sourceRow,
  };
}

export function getExcelBuyersForMedicine(
  medicine: DiscoveryMedicine,
  saltName: string,
  buyers: BackendBuyerMaster[]
): DiscoveredCompany[] {
  return buyers
    .filter(
      (b) =>
        b.saltId === medicine.saltId ||
        b.medicineId === medicine.id ||
        b.productName.toLowerCase() === medicine.name.toLowerCase()
    )
    .map((b) => buyerToDiscoveredCompany(b, medicine, saltName))
    .sort((a, b) => b.leadScore - a.leadScore);
}

/** Per-buyer subtitle from Excel fields (unique per row). */
export function formatBuyerSubtitle(company: DiscoveredCompany): string {
  const parts: string[] = [];
  if (company.casNo) parts.push(`CAS ${company.casNo}`);
  if (company.companyType && company.companyType !== "Buyer") {
    parts.push(company.companyType);
  }
  if (
    company.annualBuyingCapacityKg != null &&
    company.annualBuyingCapacityKg > 0
  ) {
    parts.push(`${company.annualBuyingCapacityKg} kg/yr`);
  }
  const contact = company.contactPersons?.[0];
  if (contact) parts.push(contact);
  else if (company.emails?.[0]) parts.push(company.emails[0]);
  if (parts.length) return parts.join(" · ");
  return company.sourceFile
    ? `From ${company.sourceFile}`
    : `${company.matchedSalt}`;
}
