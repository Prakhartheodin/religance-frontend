import type { CompanyProfileDetail } from "./company-profile-types";
import type { DiscoveredCompany } from "./types";

function excelProfile(
  company: DiscoveredCompany
): Omit<CompanyProfileDetail, keyof DiscoveredCompany> {
  const contacts =
    company.contactPersons?.map((name, index) => ({
      name,
      role: company.designations?.[index] ?? "Contact",
      email: company.emails?.[index] ?? company.emails?.[0],
      phone: company.phoneNumbers?.[index] ?? company.phoneNumbers?.[0],
    })) ?? [];

  const certificationDetails =
    company.certification && company.certification !== "—"
      ? company.certification.split(",").map((c) => c.trim())
      : [];

  const capacity =
    company.annualBuyingCapacityKg != null && company.annualBuyingCapacityKg > 0
      ? `${company.annualBuyingCapacityKg} kg/year`
      : "Not listed in Excel";

  const primaryEmail = company.emails?.[0] ?? "—";
  const primaryPhone = company.phoneNumbers?.[0] ?? "—";

  return {
    website: "",
    overview: `${company.companyName} is a ${company.companyType} buyer for ${company.matchedMedicine} (${company.matchedSalt}), imported from ${company.sourceFile ?? "Excel"} row ${company.sourceRow ?? "—"}.`,
    aiSummary: `Live Excel buyer · ${capacity} · CAS ${company.casNo ?? "—"} · ${company.location}.`,
    matchedProducts: [company.matchedMedicine],
    contacts: contacts.length
      ? contacts
      : [{ name: "—", role: "No contact listed in Excel" }],
    certificationDetails,
    sourceLinks: company.sourceFile
      ? [
          {
            label: `Excel source: ${company.sourceFile} (row ${company.sourceRow ?? "—"})`,
            url: "#excel-source",
          },
        ]
      : [],
    aiNotes: `Primary email: ${primaryEmail}. Phone: ${primaryPhone}. Score is derived from annual buying capacity in the Excel sheet.`,
  };
}

export function getCompanyProfileDetail(
  company: DiscoveredCompany
): CompanyProfileDetail {
  return { ...company, ...excelProfile(company) };
}
