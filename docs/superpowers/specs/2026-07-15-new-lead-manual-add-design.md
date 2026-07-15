# Religance CRM — New Lead Manual Add

**Date:** 2026-07-15  
**Status:** Approved — incorporates adversarial review, UI/UX review, and product decisions (2026-07-15)  
**Repos:** `religance` (frontend), `religence-backend` (Mongo schema extensions in v1 same release)  
**Related:** [`2026-07-13-crm-scalability-design.md`](./2026-07-13-crm-scalability-design.md) (Ship 2 per-item writes, `discovery-save` atomic pattern)

---

## Executive summary

Reps need to add leads manually from Lead Discovery without first saving an Excel buyer through
`SaveToContactModal`, and without picking from a pre-existing CRM company list. Today `NewLeadModal`
on Active Leads requires an existing company and uses free-text salt/medicine fields — a dead end for
net-new prospects.

This spec delivers a **unified full-page Lead Form** at `/active-leads/new` (create) and
`/active-leads/[id]` (edit). A **New Lead** button on the Lead Discovery Results header pre-fills
salt and medicine from the current panel selection; the user can override via catalogue dropdowns.
Create writes company + optional contact + lead + timeline in **one atomic `patch()`** via
`createLeadWithCompany`. v1 ships core RPPL fields only; classification, multi-product interest,
and pipeline metrics move to phase 2. Samples and Quotations sections render as **UI stubs** (no
backend) until client documentation arrives.

**v1 backend scope:** `religence-backend` `crm-entities.ts` gains `city`, `country`, `gstin`, `pan`
on companies and `saltId`, `medicineId` on leads in the **same release** as the frontend — not deferred
to Ship 2. Duplicate leads for the same company + medicine are **blocked** at save (not warn-and-allow).

Persistence in v1 is the same interim model as the rest of the CRM: atomic client state update,
then debounced per-entity saves via `persist()`. Ship 2 replaces multi-PUT creates with
`POST /v1/crm/manual-lead-create` (same atomic semantics as `discovery-save`).

---

## Product decisions (locked)

| # | Decision | Source |
|---|----------|--------|
| P1 | **Company fields v1:** Add `city`, `country`, `gstin`, `pan` to backend Mongo schema in the same release as frontend | User product decision |
| P2 | **Lead FKs v1:** Persist `saltId` and `medicineId` on leads (frontend types + backend schema) in v1 | User product decision |
| P3 | **Duplicate leads:** **Block save** when same `(companyId, medicineId)` OR `(companyId, normalize(matchedMedicine))` already exists — do NOT warn-and-allow | User product decision |
| P4 | **Row click primary:** Table row click navigates to `/active-leads/[id]`; drawer is read-only “Quick view” only (explicit chevron/button), except Send Email if applicable | Approved design Approach 1 |

---

## Decisions (locked)

| # | Decision |
|---|----------|
| D1 | **Approach 1:** Unified Lead Form Page for create **and** edit — not a modal-first flow |
| D2 | **Phased RPPL:** v1 = core fields (company, contact, single product, pipeline basics); phase 2 = classification, multi-product, metrics |
| D3 | **Routes:** `/active-leads/new` (create), `/active-leads/[id]` (view/edit) |
| D4 | **Post-create:** redirect to `/active-leads/[id]` + success toast explaining the lead will not appear in Discovery Results |
| D5 | **Samples & Quotations:** rendered as section stubs in v1; no API, no persistence |
| D6 | **Entry points:** Lead Discovery Results header **and** Active Leads page header both navigate to `/active-leads/new` |
| D7 | **Pre-fill:** Discovery **must** pass `saltId` and `medicineId` in URL when `activeMedicine` is set; form page **must not** reference `checkedSaltIds` |
| D8 | **Dedupe:** company by normalized name; contact by `(companyId, lower(email))`; **block save** on duplicate lead for same `(companyId, medicineId)` or `(companyId, normalize(matchedMedicine))` |
| D9 | **Contact:** optional in v1 (same as Active Leads `NewLeadModal`) |
| D10 | **No `discoveryCompanyId`** on manual creates in v1 — manual leads are intentionally outside the Excel buyer graph |
| D11 | **Deprecate `NewLeadModal`:** replace with route redirect; `ActiveLeadDetailDrawer` is read-only quick-preview secondary (P4) |
| D12 | **Save-and-email:** out of scope v1; user navigates to lead page and uses existing Send Email flow |
| D13 | **Button when no selection:** New Lead button is always enabled; empty pre-fill when no `activeMedicine`, full catalogue pick in form |
| D14 | **Excel buyer name collision:** warn if typed company name matches a catalogue buyer not yet in CRM; allow proceed (creates separate record without `discoveryCompanyId`) |
| D15 | **Stage default:** `Saved`; user may change in form (includes `Verified` and all `LEAD_STAGES`) |
| D16 | **Assignee:** `DEFAULT_ASSIGNEES` dropdown; default = `CURRENT_USER` (`DEFAULT_ASSIGNEES[0]`) — same as `NewLeadModal` |

---

## Relationship to scalability design

This feature lands **during or after Ship 1** (footgun deletion) and **before or alongside Ship 2**
(per-item writes). It must not reintroduce the multi-entity wipe risks documented in the scalability
spec (F1–F3).

| Scalability ship | How this feature aligns |
|------------------|-------------------------|
| **Ship 1** | Required prerequisite. Failed GET must not arm save effects; manual create must not trigger demo-data wipes. |
| **Ship 2** | v1 uses atomic client `patch()` (one state update) + debounced PUTs. Follow-up: `POST /v1/crm/manual-lead-create` with the same single-request semantics as `POST /v1/crm/discovery-save` — company, contact, lead, timeline in one backend transaction. Removes reliance on three independent debounced PUTs for a single user action. |
| **Ship 3** | Catalogue dropdowns read salts/medicines from shared master data (Mongo). `saltIds[]` many-to-many validation applies. |
| **Ship 4** | Dedupe by normalized company name becomes org-wide concern once `userId` → `orgId`; v1 dedupe rules are designed to survive that migration. |

---

## Adversarial review amendments incorporated

The 2026-07-15 adversarial review attacked the draft modal-based spec. The following amendments are
**binding** in this document:

1. **Atomic create** — replaced “extend `createLeadManual`” with `createLeadWithCompany` modeled on
   `saveFromDiscovery` (single `patch()` for company + contact + lead + timeline).
2. **Persistence honesty** — v1 interim = atomic client patch + existing debounced `persist()` saves;
   explicit Ship 2 endpoint follow-up; Lead Form uses local `saveError` state — **not** `syncError`.
3. **Dedupe rules** — normalized company name, contact email, duplicate-lead **block** (see D8, P3).
4. **Pre-fill validation** — Discovery passes `saltId` in URL; form resolves salt from URL only (not
   `checkedSaltIds`); salt must be in `medicine.saltIds`; submit blocked on invalid pair.
5. **Explicit defaults** — auto-title, score, follow-up date (pipeline field), dosageForm (see Section 2).
6. **Post-create UX** — redirect + toast; Results table remains read-only Excel buyers.
7. **Shared catalogue fields** — extract `SaltMedicineFields` component; retire free-text inputs.
8. **Full-page over modal** — unified form page replaces modal-first create (Approach 1).
9. **Testing gates** — functional QA gates defined in Section 4; UI/UX gates in Section 5.6.
10. **CRM theme fidelity** — Lead Form uses Active Leads / Ynex theme tokens (`dark:` variants, `box custom-box`); no standalone white-card RPPL layout.
11. **Backend schema v1** — `crm-entities.ts` company + lead field extensions ship with frontend (P1, P2).
12. **Buyer fetch** — Lead Form fetches catalogue buyers for company-name collision warning (§2.8).

---

## Out of scope — v1

| Item | Rationale |
|------|-----------|
| Save-and-email on create | Parity with `SaveToContactModal` deferred; use Send Email from lead page |
| Multi-product / products-of-interest list | Phase 2 RPPL |
| Lead classification, custom metrics, RPPL pipeline analytics | Phase 2 RPPL |
| Samples & Quotations backend | Pending client documentation; UI stubs only |
| Synthetic `discoveryCompanyId` for manual leads | No dedupe bridge to Excel buyers in v1 |
| Salt rename cascade to leads | Accepted denormalization debt; `saltId`/`medicineId` stored in v1 for future cascade |
| Verification Queue enforcement on manual create | Manual leads enter at user-selected stage; queue unchanged |
| `POST /v1/crm/manual-lead-create` backend route | Ship 2 follow-up; v1 uses client atomic patch + debounced PUTs |
| Appearance in Lead Discovery Results table | Results are Excel catalogue buyers, not CRM leads |
| Company master enrichment (website, certification auto-fill) | User enters manually in v1 core fields |
| Role-based create permissions | Any authenticated user (current CRM auth model) |
| Follow-ups **section** (scheduling UI) | Phase 2 stub only; distinct from working **follow-up date** pipeline field |

---

## Section 1 — UX

### 1.1 Entry points

| Source | Action | Destination |
|--------|--------|-------------|
| Lead Discovery Results header | **New Lead** button in Results `box-header` (see §5.2.2); `router.push` with query params | `/active-leads/new?saltId={resultsSaltId}&medicineId={activeMedicine.id}` when `activeMedicine` is set; `/active-leads/new` when not |
| Active Leads page header | **New lead** button (existing placement) | `/active-leads/new` (no query params) |
| Active Leads table **row click** (primary) | Navigate to full lead page | `/active-leads/[id]` |
| Active Leads table **chevron** (`ri-arrow-right-s-line`) | Open read-only quick preview | `ActiveLeadDetailDrawer` — no inline edit; **Send Email** remains available; prominent “Open full page” link to `/active-leads/[id]` |
| `/active-leads?lead={id}` (legacy) | Deep link compat | Opens quick-view drawer on list page; “Open full page” navigates to `/active-leads/[id]` |

`NewLeadModal` is deprecated: both entry points call `router.push('/active-leads/new…')` instead of
opening the modal. The modal file may remain temporarily as a thin redirect wrapper for any stale
deep links, then deleted.

### 1.2 Pre-fill from Lead Discovery

**Discovery navigation contract:** When `activeMedicine` is set, `lead-discovery-board.tsx` **must**
include `saltId` in the URL — the salt used for the Results panel buyer lookup (first salt in
`activeMedicine.saltIds` that is also in `checkedSaltIds`, else `activeMedicine.saltIds[0]`).
Discovery **must not** rely on the form page reading `checkedSaltIds`.

**Form page resolution** (URL params only — no `checkedSaltIds`):

1. Resolve `medicineId` → `DiscoveryMedicine` from CRM catalogue.
2. Resolve `saltId`:
   - If `saltId` query param present **and** `medicine.saltIds.includes(saltId)` → use it.
   - Else → use `medicine.saltIds[0]`.
3. Pre-fill form: `matchedSalt` (name), `matchedMedicine` (name), `dosageForm` from medicine record,
   hidden `saltId`/`medicineId` fields.
4. User may change salt or medicine via catalogue dropdowns; changing medicine re-filters salt options
   to `medicine.saltIds`; changing salt re-filters medicine options to those containing the salt.

### 1.3 Unified Lead Form Page layout

Single page component `LeadFormPage` with `mode: 'create' | 'edit'` driven by route.

**Page chrome:** full-page route inside `(contentlayout)` — app sidebar and header persist (same shell
as Active Leads list). Page header uses `Pageheader` breadcrumb:
`Active Leads` (link to `/active-leads`) → `{New lead | {companyName}}`. Below breadcrumb, optional
one-line subtitle in `text-textmuted text-[0.8125rem]`. Footer sticky bar: **Cancel** (navigate to
`/active-leads`), **Save** (create or update). See Section 5 for layout, theme, and truncation rules.

#### v1 sections

| Section | v1 behaviour |
|---------|--------------|
| **Lead Details** | Working — company fields, salt/medicine dropdowns, title (auto-suggested, editable), stage, assignee, lead score, **follow-up date** (pipeline field, persisted), notes, location |
| **Contacts** | Working — primary contact inline (name, role, email, phone); optional; on edit, link to add more contacts is disabled with “Manage in Contacts page” helper text |
| **Follow-ups** | **Stub section** — header + “Coming soon” empty state; no scheduling UI; **not** the same as the follow-up date field in Lead Details |
| **Samples** | Stub — section header + “Pending client documentation” empty state |
| **Quotations** | Stub — section header + “Pending client documentation” empty state |

#### Lead Details — core fields (v1)

**Company (inline create on new; editable on edit):**

| Field | Required | Notes |
|-------|----------|-------|
| Company name | Yes | Dedupe lookup on blur |
| Company type | No | Maps to `companyType` |
| City | No | New field; maps to `city` on company |
| Country | No | New field; maps to `country` on company; also copied to lead `location` if lead location empty |
| GSTIN | No | New field |
| PAN | No | New field |
| Location (display) | No | Maps to existing `location` string; default `"{city}, {country}"` when both set |

**Product:**

| Field | Required | Notes |
|-------|----------|-------|
| Salt | Yes | Catalogue dropdown |
| Medicine | Yes | Catalogue dropdown filtered by salt |
| Dosage form | Yes | Auto from medicine; editable |

**Pipeline:**

| Field | Required | Default |
|-------|----------|---------|
| Title | Yes | `{matchedMedicine} — {companyName}` (live update as names change) |
| Stage | Yes | `Saved` |
| Assignee | Yes | `CURRENT_USER` (`DEFAULT_ASSIGNEES[0]`) |
| Lead score | Yes | `50` |
| Follow-up date | Yes | Today + 7 days (persisted on lead; independent of Follow-ups stub section) |
| Notes | No | Empty string |

### 1.4 Post-create flow

1. User clicks **Save** on `/active-leads/new`.
2. Client runs validation (Section 4); on pass, calls `createLeadWithCompany`.
3. On success: `router.replace('/active-leads/{leadId}')`.
4. Toast (5s, success): **“Lead created. It won’t appear in Lead Discovery Results — view it here in Active Leads.”**
5. Page renders in edit mode with saved data.

### 1.5 Post-save (edit) flow

1. User edits fields on `/active-leads/[id]`.
2. **Save** calls `updateLeadWithCompany(leadId, patch)`.
3. Toast: **“Lead saved.”**
4. Unsaved-changes guard: `beforeunload` + in-app confirm if navigating away with dirty form.

### 1.6 Empty and error states

| State | UX |
|-------|-----|
| No catalogue salts/medicines | Banner: “Add salts and medicines in Settings first.” Save disabled. |
| Invalid salt↔medicine pair | Inline field error; Save disabled. |
| Duplicate company name found | Non-blocking info callout: “Existing company ‘{name}’ will be linked.” Show matched company summary. |
| Duplicate lead (same company + medicine) | **Blocking** error callout: “A lead for this company and medicine already exists.” Link to existing lead. **Save disabled.** |
| Catalogue buyer name match | Warning callout: “This name matches a Discovery buyer not yet in your CRM. Saving creates a separate record.” |
| Save failure (`createLeadWithCompany` / `updateLeadWithCompany` throws) | Page-level `alert alert-danger` from local `saveError` state; form retains dirty state; retry Save. **Do not** surface `syncError` on Lead Form. |

### 1.7 Accessibility

Baseline requirements; full checklist in Section 5.4.

- Page title (`Seo`) and visible heading reflect mode (New lead / Edit lead).
- Form sections use `fieldset` + `legend`.
- Save button exposes `aria-busy` during submit.
- Stub sections are informational only (not interactive); see Section 5.3.5.

---

## Section 2 — Data & API

### 2.1 Schema extensions

#### `CrmCompany` (additive — frontend + backend v1)

```typescript
type CrmCompany = {
  // existing fields unchanged
  city?: string;
  country?: string;
  gstin?: string;
  pan?: string;
};
```

All new company fields are optional strings. Empty string and undefined are treated as absent on save.

**Backend (`religence-backend/src/models/crm-entities.ts`) — v1 required:**

```typescript
// companies.fields — add:
city: { type: String, default: '' },
country: { type: String, default: '' },
gstin: { type: String, default: '' },
pan: { type: String, default: '' },
```

#### `CrmLead` (additive — frontend + backend v1)

```typescript
type CrmLead = {
  // existing fields unchanged
  saltId?: string;      // catalogue FK; written on create/update in v1
  medicineId?: string;  // catalogue FK; written on create/update in v1
};
```

`matchedSalt` and `matchedMedicine` remain the display/filter strings (denormalized names at save time).
`saltId`/`medicineId` are **always** written on create and update when catalogue selections are valid.

**Backend (`religence-backend/src/models/crm-entities.ts`) — v1 required:**

```typescript
// leads.fields — add:
saltId: { type: String, default: '' },
medicineId: { type: String, default: '' },
```

No migration required — fields are additive. Existing PUT handlers accept new keys once schema is extended.

### 2.2 Normalization helpers

```typescript
function normalizeCompanyName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function normalizeMedicineName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function findCompanyByNormalizedName(
  companies: CrmCompany[],
  name: string
): CrmCompany | undefined {
  const key = normalizeCompanyName(name);
  return companies.find((c) => normalizeCompanyName(c.name) === key);
}

function findDuplicateLead(
  leads: CrmLead[],
  companyId: string,
  medicineId: string,
  matchedMedicine: string
): CrmLead | undefined {
  const medKey = normalizeMedicineName(matchedMedicine);
  return leads.find(
    (l) =>
      l.companyId === companyId &&
      (l.medicineId === medicineId ||
        normalizeMedicineName(l.matchedMedicine) === medKey)
  );
}
```

### 2.3 `createLeadWithCompany`

**Location:** `crm-context.tsx`  
**Pattern:** Single `patch()` callback — mirrors `saveFromDiscovery` (lines 824–955).

**Input type:**

```typescript
type CreateLeadWithCompanyInput = {
  company: {
    name: string;
    companyType?: string;
    city?: string;
    country?: string;
    gstin?: string;
    pan?: string;
    location?: string;
    website?: string;
    certification?: string;
  };
  contact?: {
    name: string;
    role?: string;
    email?: string;
    phone?: string;
  } | null;
  lead: {
    saltId: string;
    medicineId: string;
    matchedSalt: string;
    matchedMedicine: string;
    dosageForm: string;
    title?: string;
    stage?: LeadStage;
    assignedTo?: string;
    leadScore?: number;
    followUpDate?: string;
    notes?: string;
    location?: string;
  };
};
```

**Returns:** `{ companyId: string; contactId: string | null; leadId: string }`

**Algorithm (single `patch()`):**

1. **Company dedupe:** `findCompanyByNormalizedName(prev.companies, input.company.name)`.
   - If found → reuse `id`; merge provided fields (non-empty wins over existing).
   - If not found → `generateCrmId("co")`, append with `sourceLinks: []`, `createdAt: todayIso()`.
2. **Contact (if `input.contact` with non-empty name or email):**
   - Dedupe: `contacts.find(c => c.companyId === company.id && c.email.toLowerCase() === email.toLowerCase())`.
   - If not found → create `generateCrmId("ct")`.
   - If no contact payload → `contactId = null`.
3. **Lead duplicate check (blocking):**
   - `findDuplicateLead(prev.leads, company.id, input.lead.medicineId, input.lead.matchedMedicine)`.
   - If found → **throw** `DuplicateLeadError` with `existingLeadId`; form surfaces error callout and disables Save.
   - Do **not** create a second lead.
4. **Lead create** (when no duplicate):
   - `title` = input or `{matchedMedicine} — {company.name}`
   - `stage` = input or `"Saved"`
   - `leadScore` = input or `50`
   - `followUpDate` = input or `followUpInDays(7)`
   - `dosageForm` = from medicine record if not overridden
   - `location` = input or `company.location` or `"{city}, {country}"` composite
   - `saltId`, `medicineId` from input
   - `companyName`, `contactName`, `contactRole`, `contactEmail` denormalized from company/contact
   - `sourceLinks: []`
   - No `discoveryCompanyId`
5. **Timeline:** append `"Lead created manually"` / `"Added via Lead Form."` / `type: "stage"`.
6. Return IDs.

### 2.4 `updateLeadWithCompany`

**Input:** `leadId: string`, `patch: Partial<CreateLeadWithCompanyInput flattened>`

**Behaviour:** Single `patch()` that:

- Updates company record referenced by `lead.companyId` when company fields present.
- Updates or creates contact when contact fields present (same dedupe rule).
- Re-runs duplicate check if `medicineId` or `matchedMedicine` changes (exclude current `leadId`).
- Updates lead fields; refreshes denormalized `companyName`, contact fields, `matchedSalt`/`matchedMedicine` when those sources change.
- Updates `saltId`/`medicineId` when catalogue selection changes; validates pair.
- Sets `lastActivity: todayIso()` on lead.
- Does **not** append timeline on routine field edits (stage changes continue to use `setLeadStage`).

### 2.5 Pre-fill validation

Before create or update submit:

```typescript
function validateSaltMedicinePair(
  saltId: string,
  medicineId: string,
  medicines: DiscoveryMedicine[]
): string | null {
  const medicine = medicines.find((m) => m.id === medicineId);
  if (!medicine) return "Medicine not found in catalogue.";
  if (!medicine.saltIds.includes(saltId)) return "Selected salt is not linked to this medicine.";
  return null;
}
```

### 2.6 Defaults summary

| Field | Default |
|-------|---------|
| `title` | `{medicine.name} — {company.name}` |
| `stage` | `Saved` |
| `leadScore` | `50` |
| `followUpDate` | `followUpInDays(7)` |
| `dosageForm` | `medicine.dosageForm` or `"API"` |
| `assignedTo` | `CURRENT_USER` (`DEFAULT_ASSIGNEES[0]` from `types.ts`) |
| `location` | `company.location` or city/country composite or `""` |
| `notes` | `""` |
| `sourceLinks` | `[]` |
| Company `website`, `certification` | `""` |

### 2.7 v1 persistence

1. `createLeadWithCompany` / `updateLeadWithCompany` perform one atomic `patch()` on client state.
2. Existing debounced per-entity saves (`companies`, `contacts`, `leads`, `timeline` — 800ms) fire via
   `persist()` as today.

**`persist()` behaviour (documented — no `syncError` on Lead Form):**

```typescript
// crm-context.tsx — existing helper
const persist = async (key, items, save) => {
  const res = await save(items, baseIdsRef.current[key]);
  if (res.live) baseIdsRef.current[key] = items.map((i) => i.id);
};
```

- `persist()` updates `baseIdsRef` on successful PUT; failures are **not** propagated to Lead Form.
- Lead Form surfaces errors only from thrown `createLeadWithCompany` / `updateLeadWithCompany` via local
  `saveError` state (validation, duplicate lead, patch callback errors).
- Debounced PUT failures after a successful local patch may leave backend briefly stale; user can retry
  Save on edit page. Full mitigation: Ship 2 atomic POST.

3. **Known v1 limitation:** up to four debounced PUTs (company, contact, lead, timeline) may arrive out
   of order. Mitigation: single `patch()` ensures local consistency; Ship 2 `POST /v1/crm/manual-lead-create`
   replaces with one backend transaction.

**Ship 2 follow-up endpoint:**

```
POST /v1/crm/manual-lead-create
Body: { company, contact?, lead }
Response: { company, contact?, lead, timelineEvent }
Dedupe: unique partial index on { scope, normalizedCompanyName } (future); contact by email;
        409 if client-sent id collides; duplicate lead 409.
```

### 2.8 Catalogue buyer name warning

On company name blur, scan fetched `catalogueBuyers` for
`normalizeCompanyName(buyer.buyerName) === normalizeCompanyName(typedName)` where no CRM company exists
with that buyer’s `discoveryCompanyId`. Surface warning per Section 1.6; do not auto-link.

**Buyer fetch:** `LeadFormPage` (or `lead-form-utils.ts` hook) calls the same buyer-master API used by
`lead-discovery-board.tsx` on mount. Do not assume buyers are in CRM context state.

---

## Section 3 — Files

### 3.1 New files

| File | Purpose |
|------|---------|
| `religance/app/(components)/(contentlayout)/active-leads/new/page.tsx` | Route shell → `LeadFormPage mode="create"` |
| `religance/app/(components)/(contentlayout)/active-leads/[id]/page.tsx` | Route shell → `LeadFormPage mode="edit"` |
| `religance/shared/crm/active-leads/lead-form-page.tsx` | Unified create/edit form page; local `saveError` + success toast state |
| `religance/shared/crm/active-leads/lead-form-sections/lead-details-section.tsx` | Company + product + pipeline fields |
| `religance/shared/crm/active-leads/lead-form-sections/contacts-section.tsx` | Primary contact fields |
| `religance/shared/crm/active-leads/lead-form-sections/stub-section.tsx` | Reusable stub for Follow-ups / Samples / Quotations |
| `religance/shared/crm/active-leads/salt-medicine-fields.tsx` | Shared catalogue dropdowns + validation display |
| `religance/shared/crm/active-leads/lead-form-toast.tsx` | Success toast (`aria-live="polite"`) + page-level error banner component |
| `religance/shared/crm/store/lead-form-utils.ts` | `normalizeCompanyName`, `normalizeMedicineName`, `findCompanyByNormalizedName`, `findDuplicateLead`, `validateSaltMedicinePair`, default builders, buyer fetch helper |

### 3.2 Modified files

| File | Change |
|------|--------|
| `religance/shared/crm/store/types.ts` | Add `city`, `country`, `gstin`, `pan` on `CrmCompany`; `saltId?`, `medicineId?` on `CrmLead` |
| `religance/shared/crm/store/crm-context.tsx` | Add `createLeadWithCompany`, `updateLeadWithCompany`; export on context type |
| `religance/shared/crm/lead-discovery/lead-discovery-board.tsx` | New Lead button in Results `box-header`; `router.push` **with `saltId` + `medicineId`** |
| `religance/shared/crm/active-leads/active-leads-board.tsx` | Row click → `router.push('/active-leads/[id]')`; chevron → drawer only; New lead → `/active-leads/new`; remove `NewLeadModal` usage; `?lead=` opens drawer |
| `religance/shared/crm/new-lead/new-lead-modal.tsx` | Deprecate: replace body with `useEffect` redirect to `/active-leads/new` |
| `religance/shared/crm/active-leads/active-lead-detail-drawer.tsx` | Read-only quick view; strip stage/edit controls; keep Send Email + “Open full page” link |
| `religance/app/globals.scss` | Styles for `.lead-form-page`, section stubs, dedupe callouts |

### 3.3 Backend (v1 — schema; Ship 2 — atomic route)

| File | When | Change |
|------|------|--------|
| `religence-backend/src/models/crm-entities.ts` | **v1** | Add `city`, `country`, `gstin`, `pan` on company schema; `saltId`, `medicineId` on lead schema |
| `religence-backend/src/routes/crm.routes.ts` | Ship 2 | `POST /v1/crm/manual-lead-create` |
| `religence-backend/src/services/crm-list.service.ts` | Ship 2 | Transactional multi-entity create |

### 3.4 Deprecated / secondary

| Artifact | Disposition |
|----------|-------------|
| `NewLeadModal` | Redirect wrapper → delete after one release |
| `ActiveLeadDetailDrawer` | Read-only quick-preview secondary (P4); full edit on `/active-leads/[id]` |
| `createLeadManual` | Retained for backward compat; no new call sites — `createLeadWithCompany` supersedes |
| `?lead={id}` query param on `/active-leads` | Retained — opens quick-view drawer; prefer `/active-leads/[id]` for full page |

---

## Section 4 — Testing & errors

### 4.1 Validation rules

| Rule | Error message | Blocks save |
|------|---------------|-------------|
| Company name empty | “Company name is required.” | Yes |
| Salt not selected | “Select a salt.” | Yes |
| Medicine not selected | “Select a medicine.” | Yes |
| Invalid salt↔medicine pair | “This salt is not linked to the selected medicine.” | Yes |
| Title empty | “Lead title is required.” | Yes |
| Contact email present but malformed | “Enter a valid email address.” | Yes |
| Contact name empty when email present | “Contact name is required when email is provided.” | Yes |
| Duplicate lead (company + medicine) | “A lead for this company and medicine already exists.” + link | Yes |

### 4.2 Duplicate handling

| Scenario | Behaviour |
|----------|-----------|
| Normalized company name matches existing CRM company | Reuse company; info callout |
| Contact email matches existing contact on company | Reuse contact |
| Lead exists for same `companyId` + `medicineId` | **Block save**; error callout with link to existing lead |
| Lead exists for same `companyId` + `normalize(matchedMedicine)` (legacy rows without `medicineId`) | **Block save**; same error callout |
| Typed name matches Excel catalogue buyer not in CRM | Warning callout; save allowed |

### 4.3 Loading and error states

| Event | UI |
|-------|-----|
| Save in flight | Save button disabled, spinner, `aria-busy="true"` |
| Catalogue loading | Salt/medicine dropdowns disabled with skeleton |
| `createLeadWithCompany` / `updateLeadWithCompany` throws | `saveError` banner (`alert alert-danger`); form stays dirty |
| Debounced PUT failure (background `persist()`) | **Not surfaced on Lead Form**; no `syncError` wiring; user may retry Save on edit |
| 404 on `/active-leads/[id]` | Redirect to `/active-leads` with “Lead not found” toast |

### 4.4 QA gates — functional (Q1–Q12)

| # | Gate | Pass criteria |
|---|------|---------------|
| Q1 | Discovery pre-fill | Select salt + medicine → New Lead → form shows correct salt, medicine, dosage form; URL contains `saltId` |
| Q2 | Multi-salt pre-fill | Two salts checked, select medicine spanning both → New Lead URL includes correct `saltId`; form matches without reading `checkedSaltIds` |
| Q3 | Catalogue override | Change medicine in form → salt dropdown re-filters; invalid pairs cannot save |
| Q4 | Atomic create | Create with new company + contact + lead → all three + timeline event appear after **full page reload** |
| Q5 | Duplicate lead block | Second lead same company + same medicine → Save disabled; error callout links existing lead |
| Q6 | Company dedupe | Create “Cipla Ltd” twice with **different** medicines → one company, two leads |
| Q7 | Contact dedupe | Same email on same company → one contact reused |
| Q8 | Post-create UX | Redirect to `/active-leads/[id]`; toast mentions not in Discovery Results |
| Q9 | Edit round-trip | Edit notes + company city on `/active-leads/[id]` → persists after reload (Mongo has city/gstin/pan/saltId/medicineId) |
| Q10 | Entry point parity | Active Leads “New lead” and Discovery “New Lead” both land on same form page |
| Q11 | `?lead=` compat | `/active-leads?lead={id}` opens quick-view drawer with correct lead; “Open full page” works |
| Q12 | saveError on failure | Force `createLeadWithCompany` throw (e.g. duplicate) → `saveError` banner; form dirty; no `syncError` on page |

UI/UX visual gates in Section 5.6 (Q13–Q20).

### 4.5 Phase 2 backlog

| Item | Notes |
|------|-------|
| RPPL classification fields | Client to provide field list |
| Multi-product interest (products array on lead) | Schema + UI table |
| Pipeline metrics widgets | Read-only analytics section |
| Follow-ups working section | Linked to timeline + calendar (distinct from follow-up date field) |
| Samples backend + UI | Pending client documentation |
| Quotations backend + UI | Pending client documentation |
| `POST /v1/crm/manual-lead-create` | Ship 2 backend atomic create |
| `saltId`/`medicineId` rename cascade | Update lead display names when catalogue edited |
| Save-and-email shortcut | Optional compose launch post-create |
| Org-wide dedupe index | `{ orgId, normalizedCompanyName }` unique partial index |
| Verification Queue routing | Option to force `Saved` stage for manual leads |

---

## Section 5 — UI/UX Requirements

Binding visual and interaction requirements from the 2026-07-15 UI/UX adversarial review. All items
are testable in implementation and QA.

### 5.1 Theme scope (no generic white-card layout)

| Surface | Theme | Rationale |
|---------|-------|-----------|
| **Lead Form page** (`/active-leads/new`, `/active-leads/[id]`) | **Active Leads theme** — Ynex `box custom-box`, theme-aware borders/backgrounds | Child route of Active Leads; matches list page, drawer, and settings form patterns |
| **Discovery “New Lead” button** (Results `box-header`) | **Lead Discovery panel theme** — same `box-header` / `ti-btn` tokens as Results panel | Button lives inside `lead-discovery-board`; must not introduce foreign styling |

**Do not** invent a standalone RPPL white-card layout. Reuse existing CRM tokens:

| Token / class | Usage |
|---------------|-------|
| `box custom-box` | Page shell and each form section card |
| `box-header border-b border-defaultborder dark:border-defaultborder/10` | Section titles |
| `box-body` | Section field grids |
| `box-footer` (form page only) | Sticky Save/Cancel bar |
| `bg-white dark:bg-bodybg` | Panel backgrounds (Discovery board, form sections) |
| `border-defaultborder dark:border-defaultborder/10` | Borders |
| `text-defaulttextcolor`, `text-textmuted`, `dark:text-textmuted/90` | Body and helper text |
| `form-label text-[0.75rem]` | Field labels (matches `NewLeadModal`, settings pages) |
| `form-control`, `form-select` | Inputs — full size on page (not `-sm`; modal `-sm` is modal-only) |
| `ti-btn ti-btn-primary`, `ti-btn ti-btn-light` | Primary / secondary actions |
| `active-leads-info-card`, `active-leads-info-card-icon` | Sub-group blocks inside Lead Details (company vs product vs pipeline) |
| `alert alert-success` / `alert alert-danger` | Save errors (`saveError`), success banners |
| `badge bg-light text-defaulttextcolor` | Phase-2 stub section markers |
| Empty-state pattern from `EmptyPanel` in `lead-discovery-board.tsx` | Stub section bodies: `avatar avatar-lg bg-primary/10 text-primary` + muted message |

Dark mode is first-class: every new rule must include `dark:` variants where sibling CRM surfaces do.

### 5.2 Layout rules

#### 5.2.1 Lead Form page shell

```
(contentlayout) — sidebar + app header unchanged
└── .lead-form-page (new wrapper in globals.scss)
    ├── Pageheader (breadcrumb)
    ├── .lead-form-page__body (scrollable)
    │   └── stacked .box.custom-box sections (Lead Details, Contacts, stubs…)
    └── .lead-form-page__footer (sticky)
        └── Cancel + Save
```

| Rule | Requirement |
|------|-------------|
| Sidebar | Persists — same `(contentlayout)` route group as `/active-leads` |
| Page width | `container-fluid` / full content width; inner sections `max-w-5xl mx-auto` optional centering |
| Section stack | Vertical gap `1rem` (`mb-4` between sections); no nested modals |
| Scroll | `.lead-form-page__body` is `flex-1 min-h-0 overflow-y-auto`; footer stays visible |
| Footer offset | Body `padding-bottom` ≥ footer height + `1rem` so last field is never hidden under sticky bar |
| Grid | `grid grid-cols-12 gap-3` inside sections; `col-span-12` default; `col-span-6` for paired fields at `md+` |
| Flex children | Every flex/grid child that can shrink must have `min-w-0` (lesson from Lead Discovery truncation fixes) |

#### 5.2.2 Discovery Results header — “New Lead” without crowding status line

Current Results `box-header` stacks `box-title` + status spans. Adding a button must not truncate the
status line or overlap the title.

**Required structure** (replace flat `box-header` content):

```html
<div class="box-header border-b … flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
  <div class="min-w-0 flex-1">
    <div class="box-title mb-0">Results …</div>
    <!-- status line: buyers count, Live, Loading, error — always below title, never beside button -->
    <div class="lead-discovery-results-status text-[0.75rem] min-w-0 truncate sm:whitespace-normal">
      …status…
    </div>
  </div>
  <button class="ti-btn ti-btn-primary shrink-0 …">New Lead</button>
</div>
```

| Rule | Requirement |
|------|-------------|
| Button placement | Right on `sm+`; full-width below title block on `<576px` |
| Status line | Lives under title, not in the same row as the button |
| Title truncation | `box-title` may truncate with `title` tooltip; status line wraps, does not overlap button |
| Button always enabled | Per D13; never `disabled` due to empty selection |
| Button label | `New Lead` (Discovery) — matches Active Leads “New lead” intent; casing differs per surface |

#### 5.2.3 Responsive breakpoints

| Breakpoint | Behaviour |
|------------|-----------|
| `<576px` | Single-column fields; Discovery New Lead button stacks under title; footer buttons full-width stacked (Save above Cancel) |
| `576–991px` | Two-column field pairs; breadcrumb may wrap |
| `≥992px` | Full grid; Discovery header row layout |

#### 5.2.4 Active Leads table — row vs chevron

| Interaction | Target | Behaviour |
|-------------|--------|-----------|
| Row click (any cell except stage/score badges) | `<tr>` | `router.push('/active-leads/{id}')` — primary navigation |
| Chevron cell click | `ri-arrow-right-s-line` icon / last `<td>` | `stopPropagation`; open read-only `ActiveLeadDetailDrawer` |
| Stage / score badges | respective `<td>` | `stopPropagation`; no navigation |

### 5.3 Component specs

#### 5.3.1 Buttons

| Variant | Classes | Min height | Notes |
|---------|---------|------------|-------|
| Primary (Save, New Lead) | `ti-btn ti-btn-primary` + `!py-2 !px-3 !text-[0.8125rem] !w-auto !h-auto shrink-0 inline-flex items-center justify-center gap-1 whitespace-nowrap` | **2.75rem (44px)** | Match `active-leads-board` New lead button |
| Secondary (Cancel) | `ti-btn ti-btn-light` | **2.75rem** | Navigates to `/active-leads` |
| Icon close (if used) | `ti-btn ti-btn-sm ti-btn-icon ti-btn-light` | 2.75rem hit area via padding | `aria-label="Close"` |

**Disabled Save — must feel intentional, not broken:**

| Disable reason | UI requirement |
|----------------|----------------|
| Validation errors | Save `disabled`; inline errors visible; **no** tooltip needed (errors explain) |
| Duplicate lead | Save `disabled`; error callout with link to existing lead |
| Catalogue empty | Save `disabled`; page-level `alert alert-warning` banner; banner text explains why |
| Submit in flight | Save `disabled`; spinner icon inside button; `aria-busy="true"`; label becomes “Saving…” |
| Pristine edit (no changes) | Save `disabled` on edit mode only; `title="No changes to save"` |

Never disable Cancel or New Lead entry buttons during loading.

#### 5.3.2 Form validation placement

| Event | Placement |
|-------|-----------|
| Field-level (required, email format, salt↔medicine) | `text-[0.75rem] text-danger mt-1` directly under the field; `aria-invalid="true"` + `aria-describedby` pointing to error id |
| Dedupe info / warning callouts | `alert` or bordered callout **above** the affected section body (company name area), not in footer |
| Duplicate lead (blocking) | `alert alert-danger` above Lead Details product subsection; Save disabled |
| Save failure (`saveError`) | Top of `.lead-form-page__body` — `alert alert-danger`; form stays dirty |
| First invalid on submit | Focus moves to first invalid field (WCAG focus-management) |

#### 5.3.3 Loading states

| State | UI |
|-------|-----|
| Page load (edit) | Skeleton or “Loading lead…” centered in body; footer hidden until hydrated |
| Catalogue loading | Salt/medicine `form-select` `disabled` + `aria-busy="true"`; placeholder option “Loading…” |
| Buyer fetch (company warning) | Non-blocking; company name field enabled; warning appears after fetch completes |
| Save | See §5.3.1 |
| Cancel with dirty form | `ConfirmDialog` or native `confirm()` — “Discard unsaved changes?” |

#### 5.3.4 Navigation and unsaved changes

| Action | Behaviour |
|--------|-----------|
| Cancel | `router.push('/active-leads')` after dirty check |
| Breadcrumb “Active Leads” | `Link` to `/active-leads`; same dirty guard |
| Browser back / `beforeunload` | Existing §1.5 guard |
| Post-create | `router.replace` — no extra back-stack entry |
| Focus on route enter | Move focus to `h3` in `Pageheader` (focus-on-route-change) |

#### 5.3.5 Stub sections (Follow-ups, Samples, Quotations)

Stubs must read as **planned**, not **broken**. The **Follow-ups stub** is separate from the working
**follow-up date** field in Lead Details pipeline (§1.3).

| Element | Requirement |
|---------|-------------|
| Section header | Normal `box-title` styling + `badge bg-light text-defaulttextcolor ms-2` with text `Phase 2` or `Coming soon` |
| Body | Reuse `StubSection` → `EmptyPanel` pattern: centered icon, muted message |
| Follow-ups copy | “Follow-up scheduling will be available in a future release.” |
| Samples / Quotations copy | “Pending client documentation.” (per §1.3) |
| Interactivity | **No** disabled buttons inside stubs; no `aria-disabled` on empty regions |
| Visual weight | Stub body opacity normal; do **not** grey out the whole section card (avoids “broken” look) |

#### 5.3.6 Quick-view drawer (read-only)

| Element | Requirement |
|---------|-------------|
| Stage dropdown / edit actions | **Removed** or disabled with helper: “Edit on full page” |
| Send Email | Retained when lead has contact email |
| Open full page | Primary text link + `ti-btn` in footer |
| Data display | Read-only fields; same theme tokens as current drawer |

### 5.4 Accessibility checklist

| # | Requirement | Pass test |
|---|-------------|-----------|
| A1 | Normal text contrast ≥ 4.5:1 in light and dark mode | axe / manual spot-check on form labels, muted text, stub copy |
| A2 | Visible `focus-visible` ring on all buttons, inputs, links | Tab through form in both themes |
| A3 | Every input has `<label htmlFor>` or `aria-label` | DOM inspection |
| A4 | Error text linked via `aria-describedby` | Screen reader announces error on focus |
| A5 | Save exposes `aria-busy` while saving | Inspect during submit |
| A6 | Toast uses `aria-live="polite"` (via `lead-form-toast.tsx`) | Create lead → toast announced |
| A7 | Page `Seo title` matches visible heading | New vs edit |
| A8 | Stub sections: `aria-labelledby` on region pointing to section heading | No focusable controls inside stubs |

### 5.5 Truncation prevention checklist

Apply before merge; derived from Lead Discovery / Active Leads / settings pagination fixes.

| # | Check | Requirement |
|---|-------|-------------|
| T1 | Flex/grid overflow | All shrinkable flex children have `min-w-0` |
| T2 | Long company / title names | `truncate` + `title` attribute on breadcrumb leaf and auto-title preview |
| T3 | Discovery header | Status line never overlaps New Lead button at 320px–1920px widths |
| T4 | Sticky footer | Last form field scrolls fully above footer on 768px-height viewport |
| T5 | Dropdown labels | Salt/medicine options use full text in native select; no fixed-width clipping on control |
| T6 | Callout text | Warning/info/error callouts wrap (`whitespace-normal`); no `overflow:hidden` on alert bodies |
| T7 | Section headings | `box-title` single-line truncate only when paired with `title` tooltip |
| T8 | Pagination (if added later) | Use `.lead-discovery-panel-footer` flex-wrap pattern — count left, controls right, `flex-shrink: 0` on children |

### 5.6 UI/UX QA gates (Q13–Q20)

| # | Gate | Pass criteria |
|---|------|---------------|
| Q13 | Dark mode parity | Lead Form readable in dark mode; borders/backgrounds match Active Leads list |
| Q14 | Discovery header layout | New Lead visible; status line (“Live · N buyers…”) not truncated or overlapped at 375px and 1280px |
| Q15 | Button touch targets | Save, Cancel, New Lead, Discovery New Lead, row chevron all ≥ 44px tall |
| Q16 | Disabled Save clarity | Duplicate lead / empty catalogue / invalid pair → clear UI; in-flight → spinner + “Saving…” |
| Q17 | Stub sections | Samples/Quotations/Follow-ups show icon empty state; follow-up **date** field still works in Lead Details |
| Q18 | Sticky footer | Save/Cancel always visible; no field hidden under footer when scrolled to end |
| Q19 | Breadcrumb back | “Active Leads” link returns to list; dirty guard fires |
| Q20 | Focus order | Logical tab order through sections; first invalid field focused on failed submit |

### 5.7 New / modified styles (`globals.scss`)

Add under a `/* Lead Form page */` comment — extend existing tokens only:

| Class | Purpose |
|-------|---------|
| `.lead-form-page` | Page flex column; `min-h-0` |
| `.lead-form-page__body` | Scrollable content |
| `.lead-form-page__footer` | `sticky bottom-0 z-[1] border-t … bg-white dark:bg-bodybg` + flex gap |
| `.lead-form-section` | Optional — `box custom-box mb-4` alias |
| `.lead-form-callout` | Dedupe info/warning/error — bordered rounded box matching `active-leads-info-card` |
| `.lead-discovery-results-status` | Status sub-line under Results title |
| `.lead-form-stub-body` | Centers EmptyPanel content inside stub sections |

Do **not** add RPPL-specific color variables or new button variants.

---

## Open questions — resolved

| Question (from adversarial review) | Resolution |
|------------------------------------|------------|
| Allow manual add when Results empty / no medicine selected? | **Yes** — button always enabled; empty pre-fill; user picks from catalogue (D13) |
| Typed name matches Excel buyer not in CRM? | **Warn and allow** — separate record without `discoveryCompanyId` (D14) |
| Is contact required? | **No** — optional like `NewLeadModal` (D9) |
| Default stage? | **`Saved`**, user-selectable (D15) |
| Who can assign? | **`DEFAULT_ASSIGNEES`**, default `CURRENT_USER` / `DEFAULT_ASSIGNEES[0]` (D16) |
| Extend `NewLeadModal` vs new page? | **Unified full page**; modal deprecated (D1, D11) |
| Ship on PUT architecture or gate on POST? | **Ship v1 on atomic client patch** + backend schema; POST in Ship 2 (Section 2.7) |
| What is RPPL reference scope? | **Phased** — v1 core only; phase 2 for full RPPL (D2) |
| Synthetic `discoveryCompanyId`? | **No** in v1 (D10) |
| Multi-contact companies? | **v1 single primary contact** on form; additional contacts via Contacts page later |
| Backend company fields in v1? | **Yes** — P1; same release as frontend |
| Duplicate lead behaviour? | **Block save** — P3 |
| Row click vs drawer? | **Full page primary** — P4 |

---

## Implementation order

1. Backend schema: `crm-entities.ts` company + lead fields (P1, P2)
2. Frontend schema types + `lead-form-utils.ts`
3. `createLeadWithCompany` / `updateLeadWithCompany` in `crm-context.tsx`
4. `SaltMedicineFields` + `lead-form-toast.tsx`
5. `LeadFormPage` + section components
6. Routes `new/page.tsx`, `[id]/page.tsx`
7. Wire Discovery + Active Leads entry points (row/chevron split, `saltId` in URL)
8. Read-only drawer + deprecate `NewLeadModal`
9. Styles + accessibility pass (Section 5)
10. QA gates Q1–Q20
