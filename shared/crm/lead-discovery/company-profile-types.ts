import type { DiscoveredCompany } from "./types";

export type CompanyContact = {
  name: string;
  role: string;
  email?: string;
  phone?: string;
};

export type CompanySourceLink = {
  label: string;
  url: string;
};

export type CompanyProfileDetail = DiscoveredCompany & {
  website: string;
  overview: string;
  aiSummary: string;
  matchedProducts: string[];
  contacts: CompanyContact[];
  certificationDetails: string[];
  sourceLinks: CompanySourceLink[];
  aiNotes: string;
};
