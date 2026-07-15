"use client";

import { DuplicateLeadDialog } from "@/shared/crm/active-leads/duplicate-lead-dialog";
import { SaltMedicineFields } from "@/shared/crm/active-leads/salt-medicine-fields";
import { StubSection } from "@/shared/crm/active-leads/lead-form-sections/stub-section";
import { LEAD_STAGES } from "@/shared/crm/active-leads/lead-stages";
import { useCrm } from "@/shared/crm/store/crm-context";
import {
  findCompanyByNormalizedName,
  findDuplicateLead,
  resolvePrefillSaltId,
  validateSaltMedicinePair,
} from "@/shared/crm/store/lead-form-utils";
import {
  CURRENT_USER,
  DEFAULT_ASSIGNEES,
  type CrmLead,
  type LeadStage,
} from "@/shared/crm/store/types";
import { followUpInDays } from "@/shared/crm/store/workflow";
import Pageheader from "@/shared/layout-components/page-header/pageheader";
import Seo from "@/shared/layout-components/seo/seo";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  const params = useParams();
  const searchParams = useSearchParams();
  const leadId = typeof params.id === "string" ? params.id : "";

  const {
    leads,
    companies,
    contacts,
    salts,
    medicines,
    hydrated,
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
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [saltId, setSaltId] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<LeadStage>("Saved");
  const [assignedTo, setAssignedTo] = useState<string>(CURRENT_USER);
  const [leadScore, setLeadScore] = useState(50);
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

  const selectedMedicine = useMemo(
    () => medicines.find((m) => m.id === medicineId),
    [medicines, medicineId]
  );
  const selectedSalt = useMemo(
    () => salts.find((s) => s.id === saltId),
    [salts, saltId]
  );

  const markDirty = () => {
    if (!dirty) setDirty(true);
  };

  useEffect(() => {
    if (mode !== "create" || hydratedForm) return;
    const medId = searchParams.get("medicineId") ?? "";
    const saltParam = searchParams.get("saltId");
    const med = medicines.find((m) => m.id === medId);
    setMedicineId(medId);
    setSaltId(resolvePrefillSaltId(saltParam, med));
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
    setContactRole(contact?.role ?? lead.contactRole);
    setContactEmail(contact?.email ?? lead.contactEmail);
    setContactPhone(contact?.phone ?? "");

    setSaltId(lead.saltId ?? "");
    setMedicineId(lead.medicineId ?? "");
    setTitle(lead.title);
    setStage(lead.stage);
    setAssignedTo(lead.assignedTo);
    setLeadScore(lead.leadScore);
    setFollowUpDate(lead.followUpDate);
    setNotes(lead.notes);
    setTitleTouched(true);
    setHydratedForm(true);
    setDirty(false);
  }, [mode, lead, getCompany, getContact, hydratedForm]);

  useEffect(() => {
    if (mode !== "edit" || !hydrated) return;
    if (!lead) router.replace("/active-leads");
  }, [mode, hydrated, lead, router]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (titleTouched || !companyName.trim() || !selectedMedicine) return;
    setTitle(`${selectedMedicine.name} — ${companyName.trim()}`);
  }, [companyName, selectedMedicine, titleTouched]);

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

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!companyName.trim()) next.companyName = "Company name is required.";
    if (!title.trim()) next.title = "Lead title is required.";
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      next.contactEmail = "Enter a valid email address.";
    }
    const pairErr = validateSaltMedicinePair(
      saltId,
      medicineId,
      salts,
      medicines
    );
    setSaltMedicineError(pairErr);
    if (pairErr) next.saltMedicine = pairErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildInput = () => ({
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
            role: contactRole.trim(),
            email: contactEmail.trim(),
            phone: contactPhone.trim() || undefined,
          }
        : null,
    lead: {
      saltId,
      medicineId,
      matchedSalt: selectedSalt?.name ?? "",
      matchedMedicine: selectedMedicine?.name ?? "",
      dosageForm: selectedMedicine?.dosageForm ?? "API",
      title: title.trim(),
      stage,
      assignedTo,
      leadScore,
      followUpDate,
      notes: notes.trim(),
      location: location.trim(),
    },
  });

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
    try {
      const input = buildInput();
      if (mode === "create") {
        const result = createLeadWithCompany(input);
        setDirty(false);
        setSuccessToast(
          "Lead created. It won't appear in Discovery Results until saved from there."
        );
        router.replace(`/active-leads/${result.leadId}`);
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
    if (!validate()) return;
    if (mode === "edit" && !dirty) return;

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
    return null;
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
          activepage={
            <Link href="/active-leads" className="hover:text-primary">
              Active Leads
            </Link>
          }
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
                      markDirty();
                    }}
                    onMedicineChange={(id) => {
                      setMedicineId(id);
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
                        className="form-control"
                        value={title}
                        aria-invalid={Boolean(errors.title)}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          setTitleTouched(true);
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
                        {DEFAULT_ASSIGNEES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
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
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="form-control"
                        value={leadScore}
                        onChange={(e) => {
                          setLeadScore(Number(e.target.value));
                          markDirty();
                        }}
                      />
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
                <h6 className="box-title mb-0 before:!hidden">Contact (optional)</h6>
              </div>
              <div className="box-body grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6">
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
                <div className="col-span-12 md:col-span-6">
                  <label className="form-label text-[0.75rem]">Role</label>
                  <input
                    className="form-control"
                    value={contactRole}
                    onChange={(e) => {
                      setContactRole(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="form-label text-[0.75rem]">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={contactEmail}
                    aria-invalid={Boolean(errors.contactEmail)}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      markDirty();
                    }}
                  />
                  {errors.contactEmail && (
                    <p className="text-[0.75rem] text-danger mt-1 mb-0">
                      {errors.contactEmail}
                    </p>
                  )}
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="form-label text-[0.75rem]">Phone</label>
                  <input
                    className="form-control"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
              </div>
            </div>

            <StubSection
              title="Follow-ups"
              message="Follow-up scheduling and reminders will be available in a future release."
            />
            <StubSection
              title="Samples"
              message="Sample request tracking will be available in a future release."
            />
            <StubSection
              title="Quotations"
              message="Quotation management will be available in a future release."
            />
          </div>
        </div>

        <div className="lead-form-page__footer sticky bottom-0 z-[1] border-t border-defaultborder dark:border-defaultborder/10 bg-white dark:bg-bodybg px-4 py-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Link
            href="/active-leads"
            className="ti-btn ti-btn-light !min-h-[2.75rem] order-2 sm:order-1"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="ti-btn ti-btn-primary !min-h-[2.75rem] order-1 sm:order-2"
            disabled={saving || catalogueEmpty || (mode === "edit" && !dirty)}
            aria-busy={saving}
            title={mode === "edit" && !dirty ? "No changes to save" : undefined}
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
          if (duplicateLead) router.push(`/active-leads/${duplicateLead.id}`);
          setDuplicateLead(null);
        }}
        onCreateDuplicate={() => void performSave()}
        onCancel={() => setDuplicateLead(null)}
      />
    </Fragment>
  );
}
