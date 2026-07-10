import type { DiscoveredCompany } from "./types";

export type DiscoveryMedicine = {
  id: string;
  saltId: string;
  name: string;
  dosageForm: string;
};

const companies = (
  saltName: string,
  medicineName: string,
  items: Omit<DiscoveredCompany, "matchedSalt" | "matchedMedicine">[]
): DiscoveredCompany[] =>
  items.map((c) => ({
    ...c,
    matchedSalt: saltName,
    matchedMedicine: medicineName,
  }));

export const DISCOVERY_MEDICINES: DiscoveryMedicine[] = [
  { id: "m-bud-1", saltId: "1", name: "Budecort Respules", dosageForm: "Respules" },
  { id: "m-bud-2", saltId: "1", name: "Foracort Inhaler", dosageForm: "Inhaler" },
  { id: "m-bud-3", saltId: "1", name: "Pulmicort Respules", dosageForm: "Respules" },
  { id: "m-bud-4", saltId: "1", name: "Derinide Inhaler", dosageForm: "Inhaler" },
  { id: "m-def-1", saltId: "2", name: "Defcort Tablet", dosageForm: "Tablet" },
  { id: "m-def-2", saltId: "2", name: "Calcort Suspension", dosageForm: "Syrup" },
  { id: "m-dut-1", saltId: "3", name: "Dutas Capsule", dosageForm: "Capsule" },
  { id: "m-dut-2", saltId: "3", name: "Duprost Tablet", dosageForm: "Tablet" },
  { id: "m-mpa-1", saltId: "4", name: "Depo-Medrol Injection", dosageForm: "Injection" },
  { id: "m-mp-1", saltId: "5", name: "Medrol Tablet", dosageForm: "Tablet" },
  { id: "m-mph-1", saltId: "6", name: "Solu-Medrol Injection", dosageForm: "Injection" },
  { id: "m-clo-1", saltId: "7", name: "Tenovate Cream", dosageForm: "Cream" },
  { id: "m-dex-1", saltId: "8", name: "Dexona Injection", dosageForm: "Injection" },
  { id: "m-dex-2", saltId: "8", name: "Decdan Tablet", dosageForm: "Tablet" },
  { id: "m-bdp-1", saltId: "9", name: "Betnovate Cream", dosageForm: "Cream" },
  { id: "m-bsp-1", saltId: "10", name: "Betnesol Injection", dosageForm: "Injection" },
  { id: "m-bv-1", saltId: "11", name: "Betnovate-N Cream", dosageForm: "Cream" },
  { id: "m-bec-1", saltId: "12", name: "Beclate Inhaler", dosageForm: "Inhaler" },
  { id: "m-mom-1", saltId: "13", name: "Nasonex Nasal Spray", dosageForm: "Nasal Spray" },
  { id: "m-pa-1", saltId: "14", name: "Pred Forte Drops", dosageForm: "Drops" },
  { id: "m-hca-1", saltId: "15", name: "Cortisone Acetate Tablet", dosageForm: "Tablet" },
  { id: "m-psp-1", saltId: "16", name: "Prednisolone Oral Solution", dosageForm: "Syrup" },
  { id: "m-clb-1", saltId: "17", name: "Clobavate Ointment", dosageForm: "Ointment" },
  { id: "m-tri-1", saltId: "18", name: "Kenacort Injection", dosageForm: "Injection" },
  { id: "m-tri-2", saltId: "18", name: "Nasacort Nasal Spray", dosageForm: "Nasal Spray" },
];

export const DISCOVERY_COMPANIES_BY_MEDICINE: Record<string, DiscoveredCompany[]> = {
  "m-bud-1": companies("Budesonide", "Budecort Respules", [
    {
      id: "c1",
      companyName: "ABC Pharma Pvt Ltd",
      dosageForm: "Respules",
      companyType: "Manufacturer",
      location: "Mumbai",
      category: "Respiratory",
      certification: "WHO-GMP",
      leadScore: 82,
      sourceProof: "https://example.com/abc-pharma",
      matchReasons: ["Manufactures Budesonide respules"],
    },
    {
      id: "c2",
      companyName: "Respira Pharma Pvt Ltd",
      dosageForm: "Respules",
      companyType: "Manufacturer",
      location: "Ahmedabad, Gujarat",
      category: "Respiratory",
      certification: "WHO-GMP",
      leadScore: 85,
      sourceProof: "https://example.com/respira",
      matchReasons: ["Active respule segment with verified GMP"],
    },
    {
      id: "c3",
      companyName: "Global Inhale Exports",
      dosageForm: "Respules",
      companyType: "Exporter",
      location: "Vadodara, Gujarat",
      category: "Respiratory",
      certification: "EU-GMP",
      leadScore: 65,
      sourceProof: "https://example.com/global-inhale",
      matchReasons: ["Exports Budesonide respules to MENA"],
    },
  ]),
  "m-bud-2": companies("Budesonide", "Foracort Inhaler", [
    {
      id: "c4",
      companyName: "AeroLung Formulations",
      dosageForm: "Inhaler",
      companyType: "Marketer",
      location: "Mumbai, Maharashtra",
      category: "Respiratory",
      certification: "ISO 9001",
      leadScore: 72,
      sourceProof: "https://example.com/aerolung",
      matchReasons: ["Markets Budesonide combination inhaler"],
    },
    {
      id: "c5",
      companyName: "MediSource Traders",
      dosageForm: "Inhaler",
      companyType: "Buyer",
      location: "Mumbai, Maharashtra",
      category: "Respiratory",
      certification: "ISO 9001",
      leadScore: 38,
      sourceProof: "https://example.com/medisource",
      matchReasons: ["Trader profile — low manufacturing proof"],
    },
  ]),
  "m-bud-3": companies("Budesonide", "Pulmicort Respules", [
    {
      id: "c6",
      companyName: "PulmoCare Laboratories",
      dosageForm: "Respules",
      companyType: "Manufacturer",
      location: "Hyderabad, Telangana",
      category: "Respiratory",
      certification: "WHO-GMP",
      leadScore: 78,
      sourceProof: "https://example.com/pulmocare",
      matchReasons: ["Multiple matched Budesonide products"],
    },
  ]),
  "m-bud-4": companies("Budesonide", "Derinide Inhaler", [
    {
      id: "c7",
      companyName: "InhaleTech India",
      dosageForm: "Inhaler",
      companyType: "Manufacturer",
      location: "Pune, Maharashtra",
      category: "Respiratory",
      certification: "WHO-GMP",
      leadScore: 71,
      sourceProof: "https://example.com/inhaletech",
      matchReasons: ["MDI manufacturing line for corticosteroids"],
    },
  ]),
  "m-def-1": companies("Deflazacort", "Defcort Tablet", [
    {
      id: "c8",
      companyName: "SteroidForm Labs",
      dosageForm: "Tablet",
      companyType: "Manufacturer",
      location: "Baddi, Himachal Pradesh",
      category: "Corticosteroid",
      certification: "WHO-GMP",
      leadScore: 76,
      sourceProof: "https://example.com/steroidform",
      matchReasons: ["Deflazacort tablet portfolio"],
    },
  ]),
  "m-def-2": companies("Deflazacort", "Calcort Suspension", [
    {
      id: "c9",
      companyName: "PediatricCare Pharma",
      dosageForm: "Syrup",
      companyType: "Marketer",
      location: "Delhi NCR",
      category: "Corticosteroid",
      certification: "ISO 9001",
      leadScore: 55,
      sourceProof: "https://example.com/pediatriccare",
      matchReasons: ["Pediatric corticosteroid brands"],
    },
  ]),
  "m-dex-1": companies("Dexamethasone Sodium Phosphate", "Dexona Injection", [
    {
      id: "c10",
      companyName: "Injecta Health Sciences",
      dosageForm: "Injection",
      companyType: "Manufacturer",
      location: "Hyderabad, Telangana",
      category: "Corticosteroid",
      certification: "USFDA",
      leadScore: 88,
      sourceProof: "https://example.com/injecta",
      matchReasons: ["Injectable corticosteroid specialist"],
    },
    {
      id: "c11",
      companyName: "Nova Steroids Ltd",
      dosageForm: "Injection",
      companyType: "Exporter",
      location: "Ahmedabad, Gujarat",
      category: "Corticosteroid",
      certification: "EU-GMP",
      leadScore: 69,
      sourceProof: "https://example.com/nova",
      matchReasons: ["Export registrations for dexamethasone"],
    },
  ]),
};

/** Fallback companies for medicines without explicit mock rows */
function defaultCompanies(
  saltName: string,
  medicine: DiscoveryMedicine
): DiscoveredCompany[] {
  return [
    {
      id: `gen-${medicine.id}-1`,
      companyName: "Religence Sample Pharma Ltd",
      matchedSalt: saltName,
      matchedMedicine: medicine.name,
      dosageForm: medicine.dosageForm,
      companyType: "Manufacturer",
      location: "Mumbai",
      category: "Pharma",
      certification: "WHO-GMP",
      leadScore: 62,
      sourceProof: "https://example.com/sample",
      matchReasons: [`Linked to ${medicine.name} via salt ${saltName}`],
    },
    {
      id: `gen-${medicine.id}-2`,
      companyName: "Allied Formulations Pvt Ltd",
      matchedSalt: saltName,
      matchedMedicine: medicine.name,
      dosageForm: medicine.dosageForm,
      companyType: "Marketer",
      location: "Ahmedabad, Gujarat",
      category: "Pharma",
      certification: "ISO 9001",
      leadScore: 48,
      sourceProof: "https://example.com/allied",
      matchReasons: ["Marketing presence for matched medicine"],
    },
  ];
}

export function getMedicinesForSalt(
  saltId: string,
  medicines: DiscoveryMedicine[] = DISCOVERY_MEDICINES
): DiscoveryMedicine[] {
  return medicines.filter((m) => m.saltId === saltId);
}

export function getMedicinesForCheckedSalts(
  saltIds: string[],
  medicines: DiscoveryMedicine[] = DISCOVERY_MEDICINES
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

export function getCompaniesForMedicine(
  medicine: DiscoveryMedicine,
  saltName: string
): DiscoveredCompany[] {
  const list =
    DISCOVERY_COMPANIES_BY_MEDICINE[medicine.id] ??
    defaultCompanies(saltName, medicine);
  return [...list].sort((a, b) => b.leadScore - a.leadScore);
}
