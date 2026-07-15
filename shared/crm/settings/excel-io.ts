// Pure, framework-free helpers for the Excel export/template of the buyer master
// — the same column shape as the files in /Excel. Import is handled server-side
// (the backend reuses its seed parser); the client only builds sheets for
// Export and Template. Kept separate from the React component so the row mapping
// can be unit-checked (see demo() — run with `npx tsx excel-io.ts`).

import type { BackendBuyerMaster } from "@/shared/crm/store/outlook-api";

// Order/labels match the reference workbooks so an export re-imports cleanly.
export const BUYER_HEADERS = [
  "Product Name",
  "CAS No",
  "Buyer Name",
  "Company Category",
  "Annual Buying Capacity KG",
  "Contact Person",
  "Designation",
  "Email Id",
  "Contact Number",
  "Country",
] as const;

export type BuyerRow = Record<(typeof BUYER_HEADERS)[number], string | number>;

const join = (v: string[]) => v.join(", ");

/** One row per buyer, arrays flattened to comma lists — the importable shape. */
export function buyersToRows(buyers: BackendBuyerMaster[]): BuyerRow[] {
  return buyers.map((b) => ({
    "Product Name": b.productName,
    "CAS No": b.casNo ?? "",
    "Buyer Name": b.buyerName,
    "Company Category": b.companyCategory ?? "",
    "Annual Buying Capacity KG": b.annualBuyingCapacityKg ?? "",
    "Contact Person": join(b.contactPersons),
    Designation: join(b.designations),
    "Email Id": join(b.emails),
    "Contact Number": join(b.phoneNumbers),
    Country: b.country ?? "",
  }));
}

export const TEMPLATE_ROWS: BuyerRow[] = [
  {
    "Product Name": "Budesonide",
    "CAS No": "51333-22-3",
    "Buyer Name": "Aurobindo Pharma Ltd",
    "Company Category": "Manufacturer",
    "Annual Buying Capacity KG": 3.06,
    "Contact Person": "Balabhadrapatruni Venkata Ramana",
    Designation: "General Manager",
    "Email Id": "info@aurobindo.com",
    "Contact Number": "91-40-23741080",
    Country: "India",
  },
];

// --- self-check: `npx tsx shared/crm/settings/excel-io.ts` ---
export function demo() {
  const assert = (c: boolean, m: string) => {
    if (!c) throw new Error("excel-io demo failed: " + m);
  };

  const rows = buyersToRows([
    {
      id: "buyer-1",
      medicineId: "med-budesonide",
      saltId: "salt-budesonide",
      productName: "Budesonide",
      casNo: null,
      buyerName: "Acme",
      companyCategory: null,
      certifications: [],
      annualBuyingCapacityKg: null,
      contactPersons: ["Jane Doe", "John Roe"],
      designations: ["CEO"],
      emails: ["a@x.com", "b@x.com"],
      phoneNumbers: ["123"],
      country: null,
      sourceFile: "x.xlsx",
      sourceRow: 3,
    },
  ]);
  assert(rows.length === 1, "one row per buyer");
  assert(rows[0]["Contact Person"] === "Jane Doe, John Roe", "joins contacts");
  assert(rows[0]["Email Id"] === "a@x.com, b@x.com", "joins emails");
  assert(rows[0]["CAS No"] === "", "null becomes empty string");
  assert(
    rows[0]["Annual Buying Capacity KG"] === "",
    "null capacity becomes empty"
  );

  assert(BUYER_HEADERS.length === 10, "ten columns like the reference file");
  assert(TEMPLATE_ROWS[0]["Product Name"] === "Budesonide", "template example");

  console.log("excel-io demo passed");
}

declare const require: { main?: unknown } | undefined;
declare const module: unknown;
if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module
) {
  demo();
}
