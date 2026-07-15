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
  const q = filters.search.trim().toLowerCase();
  return companies.filter((company) => {
    if (q) {
      const haystack = [
        company.companyName,
        company.matchedMedicine,
        company.matchedSalt,
        company.companyType,
        company.location,
        company.casNo ?? "",
        ...(company.contactPersons ?? []),
        ...(company.emails ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
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

export function collectFilterOptions(
  companies: DiscoveredCompany[]
): {
  companyTypes: string[];
  locations: string[];
  medicines: string[];
  salts: string[];
} {
  const companyTypes = new Set<string>();
  const locations = new Set<string>();
  const medicines = new Set<string>();
  const salts = new Set<string>();
  for (const c of companies) {
    if (c.companyType) companyTypes.add(c.companyType);
    if (c.location) locations.add(c.location);
    if (c.matchedMedicine) medicines.add(c.matchedMedicine);
    if (c.matchedSalt) salts.add(c.matchedSalt);
  }
  const sort = (values: Set<string>) =>
    [...values].sort((a, b) => a.localeCompare(b));
  return {
    companyTypes: sort(companyTypes),
    locations: sort(locations),
    medicines: sort(medicines),
    salts: sort(salts),
  };
}
