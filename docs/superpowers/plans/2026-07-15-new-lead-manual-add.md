# New Lead Manual Add — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a unified full-page Lead Form (`/active-leads/new`, `/active-leads/[id]`) with a Lead Discovery **New Lead** entry point, atomic company+contact+lead create, duplicate-lead confirmation dialog, and UI stubs for Follow-ups/Samples/Quotations.

**Architecture:** Extend backend Mongo schema and frontend types in the same release. Add `createLeadWithCompany` / `updateLeadWithCompany` in `crm-context.tsx` mirroring `saveFromDiscovery` (single `patch()`). Build `LeadFormPage` using existing Ynex tokens (`box custom-box`, `ti-btn`, `active-leads-info-card`). Wire Discovery and Active Leads navigation; demote drawer to read-only quick view.

**Tech stack:** Next.js App Router (`religance/`), React 18, TypeScript, Tailwind + `globals.scss`, Mongo/Mongoose (`religence-backend/`). **No automated test framework in repo** — verify with `tsc`, `build`, and manual QA gates Q1–Q24 from the spec.

**Spec:** [`docs/superpowers/specs/2026-07-15-new-lead-manual-add-design.md`](../specs/2026-07-15-new-lead-manual-add-design.md)

## Global Constraints

- **Theme:** Active Leads Ynex tokens only — `box custom-box`, `ti-btn ti-btn-primary`, `form-control`, `dark:` variants. No RPPL white-card layout.
- **Touch targets:** All buttons ≥ 44px (`2.75rem` min-height).
- **Truncation:** Flex children use `min-w-0`; callouts wrap; Discovery header two-row layout (§5.2.2).
- **Pre-fill:** Discovery passes `saltId` + `medicineId` in URL only — form never reads `checkedSaltIds`.
- **Duplicate lead:** Confirmation dialog (Edit existing / Create duplicate / Cancel) — not hard block, not browser `alert()`.
- **Persistence v1:** Atomic client `patch()` + existing debounced PUTs; local `saveError` on form — no `syncError`.
- **Assignee default:** `DEFAULT_ASSIGNEES[0]` (`CURRENT_USER`).
- **Stage default:** `Saved`.
- **Stubs:** Follow-ups / Samples / Quotations — informational empty state only; no disabled buttons inside stubs.
- **Ship 2 deferred:** `POST /v1/crm/manual-lead-create` not in this plan.

---

## How to execute

1. **Two repos:** Backend changes in `religence-backend/`; everything else in `religance/`.
2. **Order matters.** Complete Task 1 before frontend schema-dependent work. Complete Task 3 before Task 5 (form calls context methods).
3. **Verify after each task:**
   ```bash
   cd religance && npx tsc --noEmit
   cd religance && npm run build
   ```
4. **Manual QA** after Task 9 using spec §4.4 + §5.6 (Q1–Q24).
5. **Preserve line endings** per file when editing (see Ship 1 plan — mixed CRLF/LF).

---

## Files touched (summary)

| Repo | Create | Modify |
|------|--------|--------|
| `religence-backend` | — | `src/models/crm-entities.ts` |
| `religance` | `shared/crm/store/lead-form-utils.ts`, `shared/crm/active-leads/salt-medicine-fields.tsx`, `lead-form-toast.tsx`, `duplicate-lead-dialog.tsx`, `lead-form-page.tsx`, `lead-form-sections/*`, `app/.../active-leads/new/page.tsx`, `app/.../active-leads/[id]/page.tsx` | `types.ts`, `crm-context.tsx`, `lead-discovery-board.tsx`, `active-leads-board.tsx`, `active-lead-detail-drawer.tsx`, `new-lead-modal.tsx`, `globals.scss` |

---

### Task 1: Backend schema extensions

**Files:**
- Modify: `religence-backend/src/models/crm-entities.ts`

**Interfaces:**
- Produces: Mongoose fields `city`, `country`, `gstin`, `pan` on companies; `saltId`, `medicineId` on leads.

- [ ] **Step 1: Add company fields**

In `companies.fields`, after `certification`:

```typescript
city: { type: String, default: '' },
country: { type: String, default: '' },
gstin: { type: String, default: '' },
pan: { type: String, default: '' },
```

- [ ] **Step 2: Add lead FK fields**

In `leads.fields`, after `matchedMedicine`:

```typescript
saltId: { type: String, default: '' },
medicineId: { type: String, default: '' },
```

- [ ] **Step 3: Verify backend starts**

```bash
cd religence-backend && npm run build
```

Expected: exit 0.

- [ ] **Step 4: Commit (backend repo)**

```bash
git add src/models/crm-entities.ts
git commit -m "feat(crm): add company tax/location and lead catalogue FK fields"
```

---

### Task 2: Frontend types + lead-form-utils

**Files:**
- Modify: `religance/shared/crm/store/types.ts`
- Create: `religance/shared/crm/store/lead-form-utils.ts`

**Interfaces:**
- Produces: extended `CrmCompany`, `CrmLead`; `normalizeCompanyName`, `normalizeMedicineName`, `findCompanyByNormalizedName`, `findDuplicateLead`, `validateSaltMedicinePair`, `DuplicateLeadError`, `buildDefaultLeadTitle`, `fetchCatalogueBuyersForWarning`.

- [ ] **Step 1: Extend types**

```typescript
// CrmCompany — add optional:
city?: string;
country?: string;
gstin?: string;
pan?: string;

// CrmLead — add optional:
saltId?: string;
medicineId?: string;
```

- [ ] **Step 2: Create lead-form-utils.ts**

```typescript
import type { CrmCompany, CrmLead } from "./types";
import type { Medicine, Salt } from "@/shared/crm/lead-discovery/discovery-catalog";

export class DuplicateLeadError extends Error {
  existingLeadId: string;
  constructor(existingLeadId: string) {
    super("Duplicate lead for company and medicine");
    this.name = "DuplicateLeadError";
    this.existingLeadId = existingLeadId;
  }
}

export function normalizeCompanyName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export function normalizeMedicineName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export function findCompanyByNormalizedName(
  companies: CrmCompany[],
  name: string
): CrmCompany | undefined {
  const key = normalizeCompanyName(name);
  return companies.find((c) => normalizeCompanyName(c.name) === key);
}

export function findDuplicateLead(
  leads: CrmLead[],
  companyId: string,
  medicineId: string,
  matchedMedicine: string,
  excludeLeadId?: string
): CrmLead | undefined {
  const medKey = normalizeMedicineName(matchedMedicine);
  return leads.find(
    (l) =>
      l.id !== excludeLeadId &&
      l.companyId === companyId &&
      (l.medicineId === medicineId ||
        normalizeMedicineName(l.matchedMedicine) === medKey)
  );
}

export function validateSaltMedicinePair(
  saltId: string,
  medicineId: string,
  salts: Salt[],
  medicines: Medicine[]
): string | null {
  if (!saltId) return "Select a salt.";
  if (!medicineId) return "Select a medicine.";
  const medicine = medicines.find((m) => m.id === medicineId);
  if (!medicine) return "Select a medicine.";
  if (!medicine.saltIds.includes(saltId)) {
    return "This salt is not linked to the selected medicine.";
  }
  const salt = salts.find((s) => s.id === saltId);
  if (!salt) return "Select a salt.";
  return null;
}

export function buildDefaultLeadTitle(
  matchedMedicine: string,
  companyName: string
): string {
  return `${matchedMedicine} — ${companyName}`;
}

export function resolvePrefillSaltId(
  saltIdParam: string | null,
  medicine: Medicine | undefined
): string {
  if (!medicine) return saltIdParam ?? "";
  if (saltIdParam && medicine.saltIds.includes(saltIdParam)) return saltIdParam;
  return medicine.saltIds[0] ?? "";
}
```

Add `fetchCatalogueBuyersForWarning` reusing the same API as `lead-discovery-board` (`listBackendMasterData` or extract existing helper).

- [ ] **Step 3: Typecheck**

```bash
cd religance && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add shared/crm/store/types.ts shared/crm/store/lead-form-utils.ts
git commit -m "feat(crm): lead form types and normalization utils"
```

---

### Task 3: createLeadWithCompany + updateLeadWithCompany

**Files:**
- Modify: `religance/shared/crm/store/crm-context.tsx` (types block ~143, impl after `saveFromDiscovery`, exports ~2088)

**Interfaces:**
- Consumes: Task 2 utils + types.
- Produces:
  ```typescript
  createLeadWithCompany(
    input: CreateLeadWithCompanyInput,
    options?: { allowDuplicateLead?: boolean }
  ): { companyId: string; contactId: string | null; leadId: string };

  updateLeadWithCompany(
    leadId: string,
    input: Partial<CreateLeadWithCompanyInput>,
    options?: { allowDuplicateLead?: boolean }
  ): void;
  ```

- [ ] **Step 1: Add types to CrmContextValue**

Copy `CreateLeadWithCompanyInput` from spec §2.3 into `types.ts` or inline in context file.

- [ ] **Step 2: Implement createLeadWithCompany**

Mirror `saveFromDiscovery` single `patch()`:
1. Company dedupe via `findCompanyByNormalizedName` — merge non-empty fields.
2. Optional contact — dedupe by `(companyId, lower(email))`.
3. If `!options?.allowDuplicateLead` and `findDuplicateLead` hits → throw `DuplicateLeadError`.
4. Create lead with defaults: stage `Saved`, score `50`, `followUpInDays(7)`, denormalized names, `saltId`/`medicineId`, no `discoveryCompanyId`.
5. Timeline: `"Lead created manually"` / `"Added via Lead Form."`.

- [ ] **Step 3: Implement updateLeadWithCompany**

Single `patch()`: update company, contact, lead; re-run duplicate check when medicine changes (exclude current `leadId`); set `lastActivity`.

- [ ] **Step 4: Export on context provider value**

- [ ] **Step 5: Typecheck**

```bash
cd religance && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add shared/crm/store/crm-context.tsx shared/crm/store/types.ts
git commit -m "feat(crm): atomic createLeadWithCompany and updateLeadWithCompany"
```

---

### Task 4: Shared UI primitives

**Files:**
- Create: `religance/shared/crm/active-leads/salt-medicine-fields.tsx`
- Create: `religance/shared/crm/active-leads/lead-form-toast.tsx`
- Create: `religance/shared/crm/active-leads/duplicate-lead-dialog.tsx`

**Interfaces:**
- Consumes: salts/medicines from CRM context or master-data hooks; `CrmLead` for duplicate dialog props.
- Produces: `<SaltMedicineFields />`, `<LeadFormToast />`, `<DuplicateLeadDialog />`.

- [ ] **Step 1: SaltMedicineFields**

Props: `saltId`, `medicineId`, `onSaltChange`, `onMedicineChange`, `error?: string`, `disabled?: boolean`.

- Full-size `form-select` (not `-sm`).
- Medicine change → filter salt options to `medicine.saltIds`.
- Show dosage form read-only below selects.

- [ ] **Step 2: LeadFormToast**

- Success: fixed or inline banner, `aria-live="polite"`, auto-dismiss 5s.
- Error banner: `alert alert-danger` for `saveError`.

- [ ] **Step 3: DuplicateLeadDialog**

Copy shell from `save-to-contact-modal.tsx`:
- Scrim `bg-black/50 z-[160]`, dialog `z-[170]`, `max-w-lg`.
- Summary card using `active-leads-info-card`.
- Buttons: **Edit existing lead** (primary), **Create duplicate anyway** (outline), **Cancel** (light).
- `role="dialog"`, focus trap, Escape → Cancel.
- Props: `open`, `existingLead`, `companyName`, `matchedMedicine`, `onEditExisting`, `onCreateDuplicate`, `onCancel`.

- [ ] **Step 4: Typecheck + visual smoke**

Run dev server; import components in a throwaway story or temporary render — remove before commit if unused.

- [ ] **Step 5: Commit**

```bash
git add shared/crm/active-leads/salt-medicine-fields.tsx shared/crm/active-leads/lead-form-toast.tsx shared/crm/active-leads/duplicate-lead-dialog.tsx
git commit -m "feat(active-leads): salt/medicine fields, toast, duplicate dialog"
```

---

### Task 5: Form sections

**Files:**
- Create: `religance/shared/crm/active-leads/lead-form-sections/lead-details-section.tsx`
- Create: `religance/shared/crm/active-leads/lead-form-sections/contacts-section.tsx`
- Create: `religance/shared/crm/active-leads/lead-form-sections/stub-section.tsx`

**Interfaces:**
- Consumes: form state object; `SaltMedicineFields`; `LEAD_STAGES`, `DEFAULT_ASSIGNEES`.

- [ ] **Step 1: lead-details-section**

Three sub-groups (§5.3.8) with `lead-form-subgroup` / `active-leads-info-card`:
1. **Company** — name*, type, city, country, gstin, pan, location
2. **Product** — `SaltMedicineFields`, dosage form read-only
3. **Pipeline** — stage, assignee, follow-up date, score, title*, notes

Visible `form-label` on every field; required `*` in labels.

- [ ] **Step 2: contacts-section**

Optional contact: name, role, email, phone. Validation: email format; name required if email set.

- [ ] **Step 3: stub-section**

Props: `title`, `badge="Phase 2"`, `message`. Reuse EmptyPanel icon pattern — no interactive controls.

Create three instances in page: Follow-ups, Samples, Quotations (copy from spec §5.3.5).

- [ ] **Step 4: Commit**

```bash
git add shared/crm/active-leads/lead-form-sections/
git commit -m "feat(active-leads): lead form section components"
```

---

### Task 6: LeadFormPage + routes + styles

**Files:**
- Create: `religance/shared/crm/active-leads/lead-form-page.tsx`
- Create: `religance/app/(components)/(contentlayout)/active-leads/new/page.tsx`
- Create: `religance/app/(components)/(contentlayout)/active-leads/[id]/page.tsx`
- Modify: `religance/app/globals.scss`

**Interfaces:**
- Consumes: all Task 4–5 components; `createLeadWithCompany`, `updateLeadWithCompany`; utils from Task 2.

- [ ] **Step 1: LeadFormPage shell**

```tsx
"use client";
// mode: "create" | "edit"
// create: read searchParams saltId, medicineId — resolvePrefillSaltId
// edit: load lead by id from context; 404 → redirect /active-leads + toast
```

Layout (§5.2.1):
- `Pageheader` breadcrumb: Active Leads → New lead / Edit lead
- `.lead-form-page__body` scrollable sections
- Sticky footer: Cancel (`ti-btn-light`) + Save/Create (`ti-btn-primary`)

Form state: single `useState` or `useReducer` for all fields; `dirty` flag; `beforeunload` guard.

- [ ] **Step 2: Submit flow**

1. Validate all fields (inline errors on blur/submit).
2. Resolve companyId via `findCompanyByNormalizedName`.
3. `findDuplicateLead` — if hit and `!allowDuplicate`, open `DuplicateLeadDialog`.
4. On confirm duplicate → `createLeadWithCompany(input, { allowDuplicateLead: true })`.
5. On success create → `router.replace('/active-leads/' + leadId)` + success toast (mentions not in Discovery Results).
6. On `DuplicateLeadError` catch → should not happen if dialog flow correct; set `saveError`.
7. Edit → `updateLeadWithCompany`.

- [ ] **Step 3: Route pages**

```tsx
// new/page.tsx
import LeadFormPage from "@/shared/crm/active-leads/lead-form-page";
export default function NewLeadRoute() {
  return <LeadFormPage mode="create" />;
}

// [id]/page.tsx — wrap in Suspense if using useParams
export default function EditLeadRoute() {
  return <LeadFormPage mode="edit" />;
}
```

- [ ] **Step 4: globals.scss**

Add classes from spec §5.7 under `/* Lead Form page */`.

- [ ] **Step 5: Build verify**

```bash
cd religance && npx tsc --noEmit && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add shared/crm/active-leads/lead-form-page.tsx app/(components)/(contentlayout)/active-leads/new/ app/(components)/(contentlayout)/active-leads/[id]/ app/globals.scss
git commit -m "feat(active-leads): unified lead form page and routes"
```

---

### Task 7: Lead Discovery entry point

**Files:**
- Modify: `religance/shared/crm/lead-discovery/lead-discovery-board.tsx`

- [ ] **Step 1: Restructure Results box-header** (§5.2.2)

Two-row flex layout: title + status under title; **New Lead** button `shrink-0` right.

- [ ] **Step 2: Wire New Lead click**

```typescript
const handleNewLead = () => {
  const params = new URLSearchParams();
  if (activeMedicine) {
    params.set("medicineId", activeMedicine.id);
    const salt = salts.find((s) => activeMedicine.saltIds.includes(s.id));
    if (salt) params.set("saltId", salt.id);
    else if (activeMedicine.saltIds[0]) {
      params.set("saltId", activeMedicine.saltIds[0]);
    }
  }
  const q = params.toString();
  router.push(q ? `/active-leads/new?${q}` : "/active-leads/new");
};
```

Button always enabled (D13). Classes match Active Leads New lead button.

- [ ] **Step 3: Manual check Q1, Q2, Q14**

- [ ] **Step 4: Commit**

```bash
git add shared/crm/lead-discovery/lead-discovery-board.tsx app/globals.scss
git commit -m "feat(lead-discovery): New Lead button with salt/medicine pre-fill URL"
```

---

### Task 8: Active Leads navigation + read-only drawer

**Files:**
- Modify: `religance/shared/crm/active-leads/active-leads-board.tsx`
- Modify: `religance/shared/crm/active-leads/active-lead-detail-drawer.tsx`

- [ ] **Step 1: active-leads-board**

- **New lead** button → `router.push('/active-leads/new')` (remove `NewLeadModal` open state).
- Row click → `router.push('/active-leads/' + lead.id)` (exclude stage/score cells with `stopPropagation`).
- Add chevron column / last cell → opens drawer only (`stopPropagation`).
- Keep `?lead=` → opens drawer for deep link (Q11).

- [ ] **Step 2: active-lead-detail-drawer**

- Remove or disable stage dropdown, notes edit, verify actions.
- Keep Send Email when contact email exists.
- Add **Open full page** link → `/active-leads/{id}`.
- Helper text: “Quick view — edit on full page.”

- [ ] **Step 3: Manual check Q11, P4**

- [ ] **Step 4: Commit**

```bash
git add shared/crm/active-leads/active-leads-board.tsx shared/crm/active-leads/active-lead-detail-drawer.tsx
git commit -m "feat(active-leads): row navigates to form page; drawer read-only quick view"
```

---

### Task 9: Deprecate NewLeadModal

**Files:**
- Modify: `religance/shared/crm/new-lead/new-lead-modal.tsx`

- [ ] **Step 1: Replace modal body with redirect**

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function NewLeadModal({ open }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  useEffect(() => {
    if (open) {
      router.push("/active-leads/new");
    }
  }, [open, router]);
  return null;
}
```

Or remove all call sites if modal is no longer imported.

- [ ] **Step 2: Grep for remaining `NewLeadModal` / `createLeadManual` call sites** — migrate or leave `createLeadManual` unused.

- [ ] **Step 3: Commit**

```bash
git add shared/crm/new-lead/new-lead-modal.tsx
git commit -m "chore(active-leads): redirect legacy NewLeadModal to full page"
```

---

### Task 10: Manual QA + polish pass

**Files:** none new — verify entire feature.

- [ ] **Step 1: Functional gates Q1–Q12** (spec §4.4)

| Gate | Action |
|------|--------|
| Q1–Q3 | Discovery pre-fill + override |
| Q4 | Reload after create — company, contact, lead, timeline |
| Q5 | Duplicate dialog all three paths |
| Q6–Q7 | Company/contact dedupe |
| Q8 | Post-create redirect + toast |
| Q9 | Edit city/gstin — reload persists (needs backend running) |
| Q10 | Both entry points same form |
| Q11 | `?lead=` drawer + Open full page |
| Q12 | Forced error shows saveError banner |

- [ ] **Step 2: UI gates Q13–Q24** (spec §5.6)

Dark mode, 375px header, touch targets, stubs, sticky footer, duplicate dialog, theme consistency.

- [ ] **Step 3: Section 5.8 pre-delivery checklist**

- [ ] **Step 4: Fix any issues found**

- [ ] **Step 5: Final build**

```bash
cd religance && npm run build
cd religence-backend && npm run build
```

---

## Plan self-review (spec coverage)

| Spec section | Task |
|--------------|------|
| §1 UX flows | 6, 7, 8 |
| §1.8 Duplicate dialog | 4, 6 |
| §2 Data/API | 1, 2, 3 |
| §3 Files | All tasks |
| §4 Testing | 10 |
| §5 UI/UX | 4, 5, 6, 7, 10 |
| P1–P4 product decisions | 1, 3, 6, 8 |
| Ship 2 POST | Out of scope |

No TBD placeholders. Type names consistent: `CreateLeadWithCompanyInput`, `DuplicateLeadError`, `findDuplicateLead`, `allowDuplicateLead`.

---

## Execution handoff

**Plan saved to:** `docs/superpowers/plans/2026-07-15-new-lead-manual-add.md`

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
2. **Inline Execution** — implement tasks sequentially in this session with checkpoints after Tasks 3, 6, and 10.

Which approach do you want?
