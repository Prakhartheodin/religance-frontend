export type LeadDiscoveryFilters = {
  salt: string;
  medicine: string;
  category: string;
  dosageForm: string;
  companyType: string;
  location: string;
  certification: string;
};

export const EMPTY_LEAD_DISCOVERY_FILTERS: LeadDiscoveryFilters = {
  salt: "",
  medicine: "",
  category: "",
  dosageForm: "",
  companyType: "",
  location: "",
  certification: "",
};

export type DiscoveredCompany = {
  id: string;
  companyName: string;
  matchedSalt: string;
  matchedMedicine: string;
  dosageForm: string;
  companyType: string;
  location: string;
  category: string;
  certification: string;
  leadScore: number;
  sourceProof: string;
  matchReasons: string[];
};

export type LeadScoreTier = "hot" | "warm" | "cold";
