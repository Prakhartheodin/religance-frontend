// Regression gate for Ship 1 (docs/superpowers/specs/2026-07-13-crm-scalability-design.md).
//
// Three load paths could once wipe a user's CRM. Under shared (orgId) tenancy the
// same code would wipe the whole company's pipeline. They are gone. This fails the
// build if any comes back.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const grep = (p, re) => re.test(read(p));

/**
 * True if any `*SyncedRef.current = true` (which ARMS the debounced whole-array
 * save effects) is reachable without an explicit "bail out if a GET failed" guard
 * earlier in its enclosing sync function. Scoped to the function, not a fixed
 * line window: one of the assignments sits ~45 lines below its guard.
 */
export function armsWithoutLiveGuard(src) {
  const lines = src.split("\n");
  return lines.some((line, i) => {
    if (!/\w+SyncedRef\.current\s*=\s*true/.test(line)) return false;
    let start = i;
    while (start > 0 && !/const\s+sync\w*\s*=\s*async/.test(lines[start])) start--;
    const body = lines.slice(start, i).join("\n");
    return !/!\s*\w+\.live|!\s*allLive/.test(body);
  });
}

export const CHECKS = [
  {
    name: "F1 no demo-data wipe",
    why: "A read path must never delete. `isDemoCrmLeads` existed only to trigger a whole-array wipe.",
    fail: () =>
      existsSync("shared/crm/store/demo-crm.ts") ||
      grep("shared/crm/reports/reports-api.ts", /isDemoCrmLeads|saveBackend\w+\(\s*\[\s*\]\s*\)/) ||
      grep("shared/crm/store/crm-context.tsx", /isDemoCrmLeads/),
  },
  {
    name: "F2 no boot-time master re-PUT",
    why: "Re-PUTting the Excel salt/medicine list on boot deleteMany's anything added by hand.",
    fail: () => grep("shared/crm/store/crm-context.tsx", /saveBackend(Salts|Medicines)\s*\(\s*excel/i),
  },
  {
    name: "F3 no save-effect armed by a failed GET",
    why: "A failed GET must not look like 'the server says you have nothing', or the next edit PUTs [].",
    fail: () => armsWithoutLiveGuard(read("shared/crm/store/crm-context.tsx")),
  },
  {
    name: "F4 a 401 logs out",
    why: "Without this, an expired token renders an empty CRM instead of a login prompt.",
    fail: () => !grep("shared/crm/store/api-client.ts", /401/),
  },
  {
    name: "F5 no whole-array catalogue write",
    why: "Saving the whole salt/medicine array deletes everything it omits, and the boot path fired it on every login — which is what duplicated the catalogue per user. Per-item writes only.",
    fail: () =>
      grep("shared/crm/store/crm-context.tsx", /saveBackend(Salts|Medicines)/) ||
      grep("shared/crm/store/outlook-api.ts", /saveBackend(Salts|Medicines)/) ||
      grep("shared/crm/store/catalogue-api.ts", /saveBackend(Salts|Medicines)/) ||
      grep("../religence-backend/src/routes/master-data.routes.ts", /\.put\(/),
  },
  {
    name: "F6 no catalogue reset, no dead master stubs",
    why: "'Reset all' set the catalogue to [] and the array write then deleted every row. isDefaultSalt()/getDefaultSalt() were hardcoded stubs that faked a built-in/custom distinction which never existed.",
    fail: () =>
      grep("shared/crm/store/crm-context.tsx", /reset(All)?(Salts|Medicines)/) ||
      grep("shared/crm/settings/salts-settings-page.tsx", /resetAllSalts|isDefaultSalt/) ||
      grep("shared/crm/settings/medicines-settings-page.tsx", /resetAllMedicines|isDefaultMedicine/) ||
      grep("shared/crm/store/salts-master.ts", /export function (isDefaultSalt|getDefaultSalt|cloneDefaultSalts)/) ||
      grep("shared/crm/store/medicines-master.ts", /export function (isDefaultMedicine|getDefaultMedicine|cloneDefaultMedicines)/),
  },
];

// Only run the checks when invoked directly, so the helpers stay importable.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const failures = CHECKS.filter((c) => c.fail());
  for (const f of failures) console.error(`FAIL  ${f.name}\n      ${f.why}`);
  if (failures.length) {
    console.error(`\n${failures.length} destructive-write check(s) failing.`);
    process.exit(1);
  }
  console.log(`OK    all ${CHECKS.length} destructive-write checks pass.`);
}
