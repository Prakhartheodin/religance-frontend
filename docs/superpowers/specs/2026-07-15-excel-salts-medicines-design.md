# Excel Import / Export / Template for Buyer Master (salts + medicines + buyers)

Date: 2026-07-15

## Goal
Add an **Excel** dropdown button beside *New salt* (Salts Master) and *New medicine*
(Medicine Master) with three actions — Import, Export, Download template. Import ingests a
buyer-master workbook (the shape of the files in `/Excel`) and brings in **salts, medicines,
and their buyers in one go**, all linked.

## Why server-side
Buyers live in MongoDB (`BuyerCatalogue`) and previously only entered via a CLI seed script.
Lead Discovery derives salts/medicines from buyers using deterministic `salt-<slug>` /
`med-<slug>` ids. So a one-shot UI import must run on the backend, reusing the existing
`excel-master-data.ts` parser, and upsert buyers + the editable salt/medicine catalogue
together. A client-only import can't touch buyers.

## Backend
- `excel-master-data.ts` — extract `parseWorkbookBuffer(buffer, fileName)` (used by the route;
  the existing directory parser now delegates to it).
- `buyer.service.ts` — `mergeUpsertBuyers()`: additive upsert (no `deleteMany`, unlike the
  seed's `upsertBuyers`), so importing one molecule leaves the rest intact. Re-import updates
  in place (buyer id is a deterministic row hash).
- `catalogue.service.ts` — `upsertSalts()` / `upsertMedicines()`: idempotent bulk upsert keyed
  by `salt-<slug>` / `med-<slug>`, `$setOnInsert` on name so a user-renamed salt isn't reset.
- `master-data.routes.ts` — `POST /import` (`express.raw`, no multer). Parse buffer → dedupe →
  buyers → derive salts/medicines → `mergeUpsertBuyers` → `upsertSalts` (before medicines, FK)
  → `upsertMedicines` → clear cache. Returns counts.

## Frontend
- `outlook-api.ts` — `importBuyerExcel(file)`: POST raw bytes, filename in `?filename=`.
- `crm-context.tsx` — expose `refreshMasterData()` (the hydrate sync, extracted) so import can
  pull fresh salts/medicines without a reload.
- `excel-io.ts` — buyer-format row builders (`BUYER_HEADERS`, `buyersToRows`, `TEMPLATE_ROWS`)
  + `demo()` self-check.
- `excel-menu.tsx` — Import uploads → `refreshMasterData()` → toast with counts. Export dumps
  current buyers (from `/master-data`) in buyer format. Template = buyer columns + example row.

## Sheet format
The reference buyer columns: `Product Name | CAS No | Buyer Name | Company Category |
Annual Buying Capacity KG | Contact Person | Designation | Email Id | Contact Number | Country`.
Salt name = medicine name = Product Name; salt/medicine ids are slugs of it, so buyers,
medicines, and salts all link.

## Component
`shared/crm/settings/excel-menu.tsx` — one self-contained component used on both pages.
Reads `salts`, `medicines`, `addSalt`, `updateSalt`, `addMedicine`, `updateMedicine`
directly from `useCrm()`. No props. Both pages render `<ExcelMenu />` next to their
"New …" button.

UI: Preline `hs-dropdown ti-dropdown` (same idiom as `reports-page.tsx`). Button "Excel"
with caret → Import / Export / Download template. Import uses a hidden `<input type="file"
accept=".xlsx,.xls">`. A transient status line reports results/errors.

## Sheet format (one sheet)
Columns: `Medicine | Salt | Dosage Form`.

- **Export** — one row per medicine, salt name joined via `saltId`. File `salts-medicines.xlsx`.
- **Template** — headers + one example row (`Budesonide | Budesonide | API`). File
  `salts-medicines-template.xlsx`.
- **Import** — per row:
  1. Trim. Skip rows with blank Medicine or blank Salt.
  2. Find-or-create salt by name (case-insensitive) against existing + salts created earlier
     this run. New salt = `addSalt()` then `updateSalt(id, {name})`.
  3. Skip if a medicine with the same name already exists under that salt (dedup).
  4. Create medicine = `addMedicine(saltId)` then `updateMedicine(id, {name, dosageForm})`.
     Dosage form defaults to `API` if blank/unrecognised (kept as-is; the editor already
     tolerates custom forms).
  5. Accumulate counts; show `Added N salts, M medicines · skipped K`.

This find-or-create-and-link step is what satisfies "make salt and medicine connect".

## Dependency
`xlsx` (SheetJS) — new dependency. Dynamically imported inside handlers (`await import("xlsx")`)
so it stays out of the initial bundle and never runs during SSR / static export.

## Accepted ceiling
No bulk backend endpoint, so import is ~2 calls per new salt + 2 per new medicine, sequential.
Fine for master lists (tens–low hundreds of rows). Add a bulk import endpoint if volume grows.
Marked with a `ponytail:` comment in code.

## Known limitation
If a salt/medicine was previously added by hand (random id) with the same name as an imported
molecule, the import creates a second `salt-<slug>` entry (no fuzzy name merge). The whole
system keys on `salt-<slug>`, so that's the correct id; the pre-existing hand-added row is a
separate data-cleanup concern.

## Out of scope
Column-mapping UI, multi-sheet workbooks, progress bar, undo, fuzzy name-dedup against
hand-added catalogue rows. Add when real need arises.

## Note
This folder is not a git repo, so the spec is written but not committed.
