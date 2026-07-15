"use client";

import { DuplicateLeadDialog } from "@/shared/crm/active-leads/duplicate-lead-dialog";
import { SaltMedicineFields } from "@/shared/crm/active-leads/salt-medicine-fields";
import { FollowUpsSection } from "@/shared/crm/active-leads/lead-form-sections/follow-ups-section";
import { QuotationsSection } from "@/shared/crm/active-leads/lead-form-sections/quotations-section";
import { SamplesSection } from "@/shared/crm/active-leads/lead-form-sections/samples-section";
import { leadEditHref } from "@/shared/crm/active-leads/active-leads-utils";
import { LEAD_STAGES } from "@/shared/crm/active-leads/lead-stages";
import LeadScoreBadge from "@/shared/crm/lead-discovery/lead-score-badge";
import { useCrm } from "@/shared/crm/store/crm-context";
import {
  findCompanyByNormalizedName,
  findDuplicateLead,
  resolveEffectiveLeadTitle,
  resolveEffectiveSaltId,
  resolvePrefillSaltId,
  validateSaltMedicinePair,
} from "@/shared/crm/store/lead-form-utils";
import {
  fetchTeamAssignees,
  getUserDisplayName,
} from "@/shared/auth/auth-client";
import {
  DEFAULT_LEAD_SCORE,
  FALLBACK_TEAM_ASSIGNEES,
  type CrmLead,
  type LeadStage,
} from "@/shared/crm/store/types";
import { followUpInDays } from "@/shared/crm/store/workflow";
import Pageheader from "@/shared/layout-components/page-header/pageheader";
import Seo from "@/shared/layout-components/seo/seo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

type LeadFormPageProps = {
  mode: "create" | "edit";
};

type FieldErrors = Record<string, string>;

function LeadFormLoading() {
  return (
    <div className="text-center py-16 text-textmuted text-[0.875rem]">
      <span
        className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"
        role="status"
        aria-label="Loading"
      />
      <p className="mb-0">Loading lead…</p>
    </div>
  );
}

export default function LeadFormPage({ mode }: LeadFormPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId =
    mode === "edit" ? (searchParams.get("id") ?? "").trim() : "";

  const {
    leads,
    companies,
    contacts,
    salts,
    medicines,
    hydrated,
    crmSynced,
    masterDataSynced,
    createLeadWithCompany,
    updateLeadWithCompany,
    getCompany,
    getContact,
  } = useCrm();

  const lead = useMemo(
    () => (mode === "edit" ? leads.find((l) => l.id === leadId) : undefined),
    [mode, leads, leadId]
  );

  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [certification, setCertification] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactDepartment, setContactDepartment] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactNotes, setContactNotes] = useState("");

  const [saltId, setSaltId] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<LeadStage>("Saved");
  const [assignedTo, setAssignedTo] = useState<string>(() => getUserDisplayName());
  const [teamAssignees, setTeamAssignees] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState(followUpInDays(7));
  const [notes, setNotes] = useState("");

  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saltMedicineError, setSaltMedicineError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydratedForm, setHydratedForm] = useState(mode === "create");
  const [duplicateLead, setDuplicateLead] = useState<CrmLead | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);
  const [pendingNavigateLeadId, setPendingNavigateLeadId] = useState<string | null>(
    null
  );
  const [submitHint, setSubmitHint] = useState<string | null>(null);

  const selectedMedicine = useMemo(
    () => medicines.find((m) => m.id === medicineId),
    [medicines, medicineId]
  );
  const selectedSalt = useMemo(
    () => salts.find((s) => s.id === saltId),
    [salts, saltId]
  );

  const assigneeOptions = useMemo(() => {
    const base =
      teamAssignees.length > 0 ? teamAssignees : [...FALLBACK_TEAM_ASSIGNEES];
    const names = new Set<string>([...base, getUserDisplayName(), assignedTo]);
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [teamAssignees, assignedTo]);

  useEffect(() => {
    let cancelled = false;
    void fetchTeamAssignees().then((names) => {
      if (!cancelled) setTeamAssignees(names);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const markDirty = () => {
    if (!dirty) setDirty(true);
    setSubmitHint(null);
  };

  const clearFieldError = (key: string) => {
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (key === "saltMedicine") setSaltMedicineError(null);
  };

  const readyToSave = hydrated && masterDataSynced && crmSynced;

  useEffect(() => {
    if (mode !== "create" || hydratedForm) return;
    const medId = searchParams.get("medicineId") ?? "";
    const saltParam = searchParams.get("saltId");
    const med = medicines.find((m) => m.id === medId);
    setMedicineId(medId);
    setSaltId(resolvePrefillSaltId(saltParam, med));

    const cn = searchParams.get("companyName");
    if (cn) setCompanyName(cn);
    const ctype = searchParams.get("companyType");
    if (ctype) setCompanyType(ctype);
    const loc = searchParams.get("location");
    if (loc) setLocation(loc);
    const countryParam = searchParams.get("country");
    if (countryParam) setCountry(countryParam);

    const cName = searchParams.get("contactName");
    if (cName) setContactName(cName);
    const cRole = searchParams.get("contactRole");
    if (cRole) setContactRole(cRole);
    const cEmail = searchParams.get("contactEmail");
    if (cEmail) setContactEmail(cEmail);
    const cPhone = searchParams.get("contactPhone");
    if (cPhone) setContactPhone(cPhone);

    setHydratedForm(true);
  }, [mode, searchParams, medicines, hydratedForm]);

  useEffect(() => {
    if (mode !== "edit" || !lead || hydratedForm) return;
    const company = getCompany(lead.companyId);
    const contact = lead.contactId ? getContact(lead.contactId) : undefined;

    setCompanyName(company?.name ?? lead.companyName);
    setCompanyType(company?.companyType ?? "");
    setCity(company?.city ?? "");
    setCountry(company?.country ?? "");
    setGstin(company?.gstin ?? "");
    setPan(company?.pan ?? "");
    setLocation(company?.location ?? lead.location);
    setWebsite(company?.website ?? "");
    setCertification(company?.certification ?? "");

    setContactName(contact?.name ?? lead.contactName);
    const roleParts = (contact?.role ?? lead.contactRole).split(" · ");
    setContactRole(roleParts[0] ?? "");
    setContactDepartment(roleParts[1] ?? "");
    setContactEmail(contact?.email ?? lead.contactEmail);
    setContactPhone(contact?.phone ?? "");

    setSaltId(lead.saltId ?? "");
    setMedicineId(lead.medicineId ?? "");
    setTitle(lead.title);
    setStage(lead.stage);
    setAssignedTo(lead.assignedTo);
    setFollowUpDate(lead.followUpDate);
    setNotes(lead.notes);
    setTitleTouched(true);
    setHydratedForm(true);
    setDirty(false);
  }, [mode, lead, getCompany, getContact, hydratedForm]);

  useEffect(() => {
    if (!pendingNavigateLeadId) return;
    if (!leads.some((l) => l.id === pendingNavigateLeadId)) return;
    router.replace(leadEditHref(pendingNavigateLeadId));
    setPendingNavigateLeadId(null);
  }, [pendingNavigateLeadId, leads, router]);

  useEffect(() => {
    if (titleTouched || !companyName.trim() || !selectedMedicine) return;
    const autoTitle = `${selectedMedicine.name} — ${companyName.trim()}`;
    setTitle(autoTitle);
    clearFieldError("title");
  }, [companyName, selectedMedicine, titleTouched]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!successToast) return;
    const t = window.setTimeout(() => setSuccessToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [successToast]);

  const fillFromExistingCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (!company) return;
    setCompanyName(company.name);
    setCompanyType(company.companyType);
    setCity(company.city ?? "");
    setCountry(company.country ?? "");
    setGstin(company.gstin ?? "");
    setPan(company.pan ?? "");
    setLocation(company.location);
    setWebsite(company.website);
    setCertification(company.certification);
    markDirty();
  };

  const scrollToField = (fieldId: string) => {
    document.getElementById(fieldId)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const validate = (): boolean => {
    const effectiveSaltId = resolveEffectiveSaltId(saltId, medicineId, medicines);
    const effectiveTitle = resolveEffectiveLeadTitle(
      title,
      titleTouched,
      companyName,
      selectedMedicine
    );

    const next: FieldErrors = {};
    if (!companyName.trim()) next.companyName = "Company name is required.";
    if (!effectiveTitle) next.title = "Lead title is required.";
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      next.contactEmail = "Enter a valid email address.";
    }
    const pairErr = validateSaltMedicinePair(
      effectiveSaltId,
      medicineId,
      salts,
      medicines
    );
    setSaltMedicineError(pairErr);
    if (pairErr) next.saltMedicine = pairErr;
    setErrors(next);
    const valid = Object.keys(next).length === 0;
    if (!valid) {
      const firstKey = Object.keys(next)[0];
      const fieldId =
        firstKey === "companyName"
          ? "company-name"
          : firstKey === "title"
            ? "lead-title"
            : firstKey === "saltMedicine"
              ? "lead-medicine"
              : firstKey === "contactEmail"
                ? "contact-email"
                : undefined;
      if (fieldId) scrollToField(fieldId);
      setSubmitHint(
        next.saltMedicine ??
          next.companyName ??
          next.title ??
          next.contactEmail ??
          "Fix the highlighted fields above."
      );
    } else {
      setSubmitHint(null);
    }
    return valid;
  };

  const buildInput = () => {
    const effectiveSaltId = resolveEffectiveSaltId(saltId, medicineId, medicines);
    const effectiveTitle = resolveEffectiveLeadTitle(
      title,
      titleTouched,
      companyName,
      selectedMedicine
    );
    const effectiveSalt =
      salts.find((s) => s.id === effectiveSaltId) ?? selectedSalt;

    return {
    company: {
      name: companyName.trim(),
      companyType: companyType.trim(),
      city: city.trim(),
      country: country.trim(),
      gstin: gstin.trim(),
      pan: pan.trim(),
      location: location.trim(),
      website: website.trim(),
      certification: certification.trim(),
    },
    contact:
      contactName.trim() || contactEmail.trim()
        ? {
            name: contactName.trim(),
            role: [contactRole.trim(), contactDepartment.trim()]
              .filter(Boolean)
              .join(" · "),
            email: contactEmail.trim(),
            phone: contactPhone.trim() || undefined,
          }
        : null,
    lead: {
      saltId: effectiveSaltId,
      medicineId,
      matchedSalt: effectiveSalt?.name ?? selectedSalt?.name ?? "",
      matchedMedicine: selectedMedicine?.name ?? "",
      dosageForm: selectedMedicine?.dosageForm ?? "API",
      title: effectiveTitle,
      stage,
      assignedTo,
      followUpDate,
      notes: notes.trim(),
      location: location.trim(),
    },
  };
  };

  const resolveCompanyId = () => {
    if (mode === "edit" && lead) return lead.companyId;
    const existing = findCompanyByNormalizedName(companies, companyName.trim());
    return existing?.id ?? "";
  };

  const checkDuplicate = (excludeLeadId?: string) => {
    const companyId = resolveCompanyId();
    if (!companyId && mode === "create") {
      const existing = findCompanyByNormalizedName(companies, companyName.trim());
      if (!existing) return undefined;
      return findDuplicateLead(
        leads,
        existing.id,
        medicineId,
        selectedMedicine?.name ?? "",
        excludeLeadId
      );
    }
    if (!companyId) return undefined;
    return findDuplicateLead(
      leads,
      companyId,
      medicineId,
      selectedMedicine?.name ?? "",
      excludeLeadId
    );
  };

  const performSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSubmitHint(null);
    try {
      const input = buildInput();
      if (mode === "create") {
        const result = createLeadWithCompany(input);
        setDirty(false);
        setSuccessToast(
          "Lead created. It won't appear in Discovery Results until saved from there."
        );
        setPendingNavigateLeadId(result.leadId);
      } else if (lead) {
        updateLeadWithCompany(lead.id, input);
        setDirty(false);
        setSuccessToast("Lead saved.");
      }
    } catch {
      setSaveError("Could not save lead. Check your connection and try again.");
    } finally {
      setSaving(false);
      setDuplicateLead(null);
    }
  };

  const handleSubmit = () => {
    if (!readyToSave) {
      setSubmitHint("Still syncing your CRM data — try again in a moment.");
      return;
    }
    if (catalogueEmpty) {
      setSubmitHint(
        "Add salts and medicines in Settings before creating a lead."
      );
      return;
    }
    if (!validate()) return;
    if (mode === "edit" && !dirty) return;

    const effectiveSaltId = resolveEffectiveSaltId(saltId, medicineId, medicines);
    const effectiveTitle = resolveEffectiveLeadTitle(
      title,
      titleTouched,
      companyName,
      selectedMedicine
    );
    if (effectiveSaltId !== saltId) setSaltId(effectiveSaltId);
    if (effectiveTitle && effectiveTitle !== title) setTitle(effectiveTitle);

    const dup = checkDuplicate(mode === "edit" ? lead?.id : undefined);
    if (dup) {
      setDuplicateLead(dup);
      return;
    }
    void performSave();
  };

  if (mode === "edit" && !hydrated) {
    return (
      <Fragment>
        <Seo title="Edit lead" />
        <LeadFormLoading />
      </Fragment>
    );
  }

  if (mode === "edit" && hydrated && !lead) {
    return (
      <Fragment>
        <Seo title="Lead not found" />
        <div className="max-w-5xl mx-auto py-8">
          <div className="alert alert-warning text-[0.8125rem] mb-3" role="alert">
            This lead could not be found. It may have been deleted or is still
            syncing.
          </div>
          <Link href="/active-leads" className="ti-btn ti-btn-primary">
            Back to Active Leads
          </Link>
        </div>
      </Fragment>
    );
  }

  if (!hydratedForm) {
    return (
      <Fragment>
        <Seo title={mode === "create" ? "New lead" : "Edit lead"} />
        <LeadFormLoading />
      </Fragment>
    );
  }

  const pageTitle = mode === "create" ? "New lead" : "Edit lead";
  const catalogueEmpty = medicines.length === 0 || salts.length === 0;

  return (
    <Fragment>
      <Seo title={pageTitle} />
      <div className="lead-form-page flex flex-col min-h-0">
        <Pageheader
          currentpage={pageTitle}
          activepage="Active Leads"
          mainpage={pageTitle}
        />

        {successToast && (
          <div
            className="alert alert-success text-[0.8125rem] mb-3"
            role="status"
            aria-live="polite"
          >
            {successToast}
          </div>
        )}

        <div className="lead-form-page__body flex-1 min-h-0 overflow-y-auto pb-24">
          {saveError && (
            <div className="alert alert-danger text-[0.8125rem] mb-3" role="alert">
              {saveError}
            </div>
          )}

          {catalogueEmpty && (
            <div className="alert alert-warning text-[0.8125rem] mb-3" role="alert">
              Salts and medicines catalogue is empty. Add catalogue items in Settings
              before creating a lead.
            </div>
          )}

          {!readyToSave && (
            <div className="alert alert-info text-[0.8125rem] mb-3" role="status">
              Loading CRM data… save will be available in a moment.
            </div>
          )}

          <div className="max-w-5xl mx-auto">
            <div className="box custom-box mb-4">
              <div className="box-header border-b border-defaultborder dark:border-defaultborder/10">
                <h6 className="box-title mb-0 before:!hidden">Lead details</h6>
              </div>
              <div className="box-body space-y-4">
                <div className="lead-form-subgroup">
                  <h6 className="text-[0.75rem] font-semibold text-textmuted uppercase tracking-wide mb-3">
                    Company
                  </h6>
                  <div className="grid grid-cols-12 gap-3">
                    {companies.length > 0 && mode === "create" && (
                      <div className="col-span-12">
                        <label className="form-label text-[0.75rem]">
                          Fill from existing
                        </label>
                        <select
                          className="form-select"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) fillFromExistingCompany(e.target.value);
                          }}
                        >
                          <option value="">Select company…</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]" htmlFor="company-name">
                        Company name
                      </label>
                      <input
                        id="company-name"
                        className="form-control"
                        value={companyName}
                        aria-invalid={Boolean(errors.companyName)}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          clearFieldError("companyName");
                          markDirty();
                        }}
                      />
                      {errors.companyName && (
                        <p className="text-[0.75rem] text-danger mt-1 mb-0">
                          {errors.companyName}
                        </p>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">Company type</label>
                      <input
                        className="form-control"
                        value={companyType}
                        onChange={(e) => {
                          setCompanyType(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">City</label>
                      <input
                        className="form-control"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">Country</label>
                      <input
                        className="form-control"
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">GSTIN</label>
                      <input
                        className="form-control"
                        value={gstin}
                        onChange={(e) => {
                          setGstin(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">PAN</label>
                      <input
                        className="form-control"
                        value={pan}
                        onChange={(e) => {
                          setPan(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">Location</label>
                      <input
                        className="form-control"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">Website</label>
                      <input
                        className="form-control"
                        value={website}
                        onChange={(e) => {
                          setWebsite(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="lead-form-subgroup">
                  <h6 className="text-[0.75rem] font-semibold text-textmuted uppercase tracking-wide mb-3">
                    Product
                  </h6>
                  <SaltMedicineFields
                    saltId={saltId}
                    medicineId={medicineId}
                    error={saltMedicineError ?? errors.saltMedicine}
                    disabled={catalogueEmpty}
                    onSaltChange={(id) => {
                      setSaltId(id);
                      clearFieldError("saltMedicine");
                      markDirty();
                    }}
                    onMedicineChange={(id) => {
                      setMedicineId(id);
                      clearFieldError("saltMedicine");
                      markDirty();
                    }}
                  />
                </div>

                <div className="lead-form-subgroup">
                  <h6 className="text-[0.75rem] font-semibold text-textmuted uppercase tracking-wide mb-3">
                    Pipeline
                  </h6>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12">
                      <label className="form-label text-[0.75rem]">Lead title</label>
                      <input
                        id="lead-title"
                        className="form-control"
                        value={title}
                        aria-invalid={Boolean(errors.title)}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          setTitleTouched(true);
                          clearFieldError("title");
                          markDirty();
                        }}
                      />
                      {errors.title && (
                        <p className="text-[0.75rem] text-danger mt-1 mb-0">
                          {errors.title}
                        </p>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">Stage</label>
                      <select
                        className="form-select"
                        value={stage}
                        onChange={(e) => {
                          setStage(e.target.value as LeadStage);
                          markDirty();
                        }}
                      >
                        {LEAD_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">Assignee</label>
                      <select
                        className="form-select"
                        value={assignedTo}
                        onChange={(e) => {
                          setAssignedTo(e.target.value);
                          markDirty();
                        }}
                      >
                        {assigneeOptions.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <p className="text-[0.75rem] text-textmuted mb-0 mt-1">
                        Your organization&apos;s sales team — not customer contacts.
                      </p>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">Follow-up date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={followUpDate}
                        onChange={(e) => {
                          setFollowUpDate(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="form-label text-[0.75rem]">Lead score</label>
                      <div className="py-2">
                        <LeadScoreBadge
                          score={
                            mode === "create"
                              ? DEFAULT_LEAD_SCORE
                              : (lead?.leadScore ?? DEFAULT_LEAD_SCORE)
                          }
                        />
                      </div>
                    </div>
                    <div className="col-span-12">
                      <label className="form-label text-[0.75rem]">Notes</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="box custom-box mb-4">
              <div className="box-header border-b border-defaultborder dark:border-defaultborder/10">
                <h6 className="box-title mb-0 before:!hidden">Add contact (optional)</h6>
              </div>
              <div className="box-body grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-4">
                  <label className="form-label text-[0.75rem]">Name</label>
                  <input
                    className="form-control"
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="form-label text-[0.75rem]">Designation</label>
                  <input
                    className="form-control"
                    value={contactRole}
                    onChange={(e) => {
                      setContactRole(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="form-label text-[0.75rem]">Department</label>
                  <input
                    className="form-control"
                    placeholder="Purchase / QA / R&D / Management"
                    value={contactDepartment}
                    onChange={(e) => {
                      setContactDepartment(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="form-label text-[0.75rem]">Phone / WhatsApp</label>
                  <input
                    className="form-control"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="form-label text-[0.75rem]">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="form-control"
                    value={contactEmail}
                    aria-invalid={Boolean(errors.contactEmail)}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      clearFieldError("contactEmail");
                      markDirty();
                    }}
                  />
                  {errors.contactEmail && (
                    <p className="text-[0.75rem] text-danger mt-1 mb-0">
                      {errors.contactEmail}
                    </p>
                  )}
                </div>
                <div className="col-span-12">
                  <label className="form-label text-[0.75rem]">Contact notes</label>
                  <input
                    className="form-control"
                    value={contactNotes}
                    onChange={(e) => {
                      setContactNotes(e.target.value);
                      markDirty();
                    }}
                  />
                  <p className="text-[0.75rem] text-textmuted mb-0 mt-1">
                    UI preview — not saved with the lead yet.
                  </p>
                </div>
              </div>
            </div>

            <FollowUpsSection />
            <SamplesSection />
            <QuotationsSection />
          </div>
        </div>

        <div className="lead-form-page__footer sticky bottom-0 z-20 border-t border-defaultborder dark:border-defaultborder/10 bg-white dark:bg-bodybg px-4 py-3 flex flex-col sm:flex-row gap-2 sm:justify-end sm:items-center">
          {submitHint && (
            <p
              className="text-[0.75rem] text-danger mb-0 sm:me-auto order-first sm:order-none w-full sm:w-auto"
              role="alert"
            >
              {submitHint}
            </p>
          )}
          <Link
            href="/active-leads"
            className="ti-btn ti-btn-light !min-h-[2.75rem] order-2 sm:order-1"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="ti-btn ti-btn-primary !min-h-[2.75rem] order-1 sm:order-2"
            disabled={
              saving ||
              !readyToSave ||
              catalogueEmpty ||
              (mode === "edit" && !dirty)
            }
            aria-busy={saving}
            title={
              !readyToSave
                ? "CRM data is still loading"
                : mode === "edit" && !dirty
                  ? "No changes to save"
                  : undefined
            }
            onClick={handleSubmit}
          >
            {saving ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin me-1" />
                Saving…
              </>
            ) : mode === "create" ? (
              "Create lead"
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      <DuplicateLeadDialog
        open={duplicateLead !== null}
        existingLead={duplicateLead}
        companyName={companyName.trim()}
        matchedMedicine={selectedMedicine?.name ?? ""}
        onEditExisting={() => {
          if (duplicateLead) router.push(leadEditHref(duplicateLead.id));
          setDuplicateLead(null);
        }}
        onCreateDuplicate={() => void performSave()}
        onCancel={() => setDuplicateLead(null)}
      />
    </Fragment>
  );
}
