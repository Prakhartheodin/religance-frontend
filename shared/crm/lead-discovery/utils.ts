import type {
  DiscoveredCompany,
  LeadDiscoveryFilters,
  LeadScoreTier,
} from "./types";

export function getLeadScoreTier(score: number): LeadScoreTier {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

export function getLeadScoreLabel(tier: LeadScoreTier): string {
  switch (tier) {
    case "hot":
      return "Hot Lead";
    case "warm":
      return "Warm Lead";
    default:
      return "Cold Lead";
  }
}

export function hasActiveFilters(filters: LeadDiscoveryFilters): boolean {
  return Object.values(filters).some((value) => value !== "");
}

export function filterDiscoveredCompanies(
  companies: DiscoveredCompany[],
  filters: LeadDiscoveryFilters
): DiscoveredCompany[] {
  return companies.filter((company) => {
    if (filters.salt && company.matchedSalt !== filters.salt) return false;
    if (filters.medicine && company.matchedMedicine !== filters.medicine)
      return false;
    if (filters.category && company.category !== filters.category) return false;
    if (filters.dosageForm && company.dosageForm !== filters.dosageForm)
      return false;
    if (filters.companyType && company.companyType !== filters.companyType)
      return false;
    if (filters.location && company.location !== filters.location) return false;
    if (
      filters.certification &&
      company.certification !== filters.certification
    )
      return false;
    return true;
  });
}
