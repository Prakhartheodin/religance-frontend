/** RPPL-aligned picklists for lead classification fields. */
export const MARKET_TIERS = [
  "",
  "Tier 1",
  "Tier 2",
  "Tier 3",
  "Domestic",
  "Export",
] as const;

export const LEAD_SEGMENTS = [
  "",
  "API",
  "Formulation",
  "Trader",
  "CMO",
  "CDMO",
  "Distributor",
  "Exporter",
] as const;

export const LEAD_SOURCES = [
  "",
  "Referral",
  "Trade show",
  "Website",
  "Cold call",
  "Email campaign",
  "LinkedIn",
  "Existing customer",
  "Partner",
  "Other",
] as const;

export const LEAD_PRIORITIES = ["", "High", "Medium", "Low"] as const;

export const QUAL_SCORE_MAX = 25;
