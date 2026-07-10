import type { CompanyProfileDetail } from "./company-profile-types";
import type { DiscoveredCompany } from "./types";

/** Rich mock profiles keyed by company id; others get generated defaults. */
const PROFILE_OVERRIDES: Partial<
  Record<string, Omit<CompanyProfileDetail, keyof DiscoveredCompany>>
> = {
  c1: {
    website: "https://abcpharma.example.com",
    overview:
      "ABC Pharma Pvt Ltd is an established respiratory formulations manufacturer with dedicated Budesonide respule lines and export readiness across India and MENA.",
    aiSummary:
      "Strong fit for Budesonide respule supply — verified GMP, active respiratory portfolio, and documented export history.",
    matchedProducts: [
      "Budecort Respules 0.5mg",
      "Budecort Respules 1mg",
      "Budesonide MDI (development)",
    ],
    contacts: [
      {
        name: "Rajesh Mehta",
        role: "Purchase Manager",
        email: "rajesh.mehta@abcpharma.example.com",
        phone: "+91 98XXX XXXXX",
      },
      {
        name: "Priya Shah",
        role: "Business Development",
        email: "bd@abcpharma.example.com",
      },
    ],
    certificationDetails: ["WHO-GMP", "ISO 9001:2015", "Schedule M compliant facility"],
    sourceLinks: [
      { label: "Corporate website — product catalog", url: "https://example.com/abc-pharma" },
      { label: "CDSCO filing reference", url: "https://example.com/abc-cdsco" },
    ],
    aiNotes:
      "Confidence high. Recommend intro email highlighting respule capacity and salt-specific outreach template.",
  },
  c2: {
    website: "https://respirapharma.example.com",
    overview:
      "Respira Pharma operates a WHO-GMP certified site in Ahmedabad focused on inhaled and nebulized corticosteroids.",
    aiSummary:
      "Manufacturer with multiple Budesonide SKUs; suitable for long-term API and FDF partnership discussions.",
    matchedProducts: ["Pulmicort-class respules", "Budesonide nebulizer solution"],
    contacts: [
      {
        name: "Anita Desai",
        role: "Head of Institutional Sales",
        email: "anita.desai@respirapharma.example.com",
      },
    ],
    certificationDetails: ["WHO-GMP", "EU-GMP (in progress)"],
    sourceLinks: [
      { label: "Product brochure PDF", url: "https://example.com/respira-products" },
    ],
    aiNotes: "Verify EU-GMP timeline before positioning for EU export deals.",
  },
};

function defaultProfile(
  company: DiscoveredCompany
): Omit<CompanyProfileDetail, keyof DiscoveredCompany> {
  return {
    website: `https://${company.companyName.toLowerCase().replace(/\s+/g, "")}.example.com`,
    overview: `${company.companyName} is a ${company.companyType.toLowerCase()} in ${company.location} with activity in ${company.category} and ${company.dosageForm} dosage forms for ${company.matchedSalt}-based products.`,
    aiSummary: `Relevant because the company matches ${company.matchedMedicine} (${company.matchedSalt}) in the ${company.category} segment.`,
    matchedProducts: [
      `${company.matchedMedicine} (${company.dosageForm})`,
      `Additional ${company.matchedSalt} formulations`,
    ],
    contacts: [
      {
        name: "Commercial contact",
        role: "Business Development",
        email: "contact@example.com",
      },
    ],
    certificationDetails: [company.certification],
    sourceLinks: [
      { label: "Discovery source proof", url: company.sourceProof },
      { label: "Public product listing", url: company.sourceProof },
    ],
    aiNotes:
      "Review source proof before saving to contacts. Confirm manufacturing vs trading status in first outreach.",
  };
}

export function getCompanyProfileDetail(
  company: DiscoveredCompany
): CompanyProfileDetail {
  const extra = PROFILE_OVERRIDES[company.id] ?? defaultProfile(company);
  return { ...company, ...extra };
}
