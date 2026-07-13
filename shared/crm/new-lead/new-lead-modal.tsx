"use client";

import { useCrm } from "@/shared/crm/store/crm-context";
import { CURRENT_USER, DEFAULT_ASSIGNEES } from "@/shared/crm/store/types";
import { followUpInDays } from "@/shared/crm/store/workflow";
import type { LeadStage } from "@/shared/crm/store/types";
import { LEAD_STAGES } from "@/shared/crm/active-leads/lead-stages";
import { useRouter } from "next/navigation";
import { useState } from "react";

type NewLeadModalProps = {
  open: boolean;
  onClose: () => void;
};

export function NewLeadModal({ open, onClose }: NewLeadModalProps) {
  const router = useRouter();
  const { companies, contacts, createLeadManual } = useCrm();
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [title, setTitle] = useState("");
  const [matchedSalt, setMatchedSalt] = useState("");
  const [matchedMedicine, setMatchedMedicine] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>(CURRENT_USER);
  const [stage, setStage] = useState<LeadStage>("Saved");

  if (!open) return null;

  const company = companies.find((c) => c.id === companyId);
  const companyContacts = contacts.filter((c) => c.companyId === companyId);
  const contact = companyContacts.find((c) => c.id === contactId);

  const handleCreate = () => {
    if (!company || !title.trim()) return;
    const leadId = createLeadManual({
      title: title.trim(),
      companyId: company.id,
      contactId: contact?.id ?? null,
      companyName: company.name,
      contactName: contact?.name ?? "—",
      contactRole: contact?.role ?? "—",
      contactEmail: contact?.email ?? "",
      matchedSalt: matchedSalt || "—",
      matchedMedicine: matchedMedicine || "—",
      dosageForm: dosageForm || "—",
      location: company.location,
      stage,
      leadScore: 50,
      assignedTo,
      followUpDate: followUpInDays(7),
      notes: "",
    });
    onClose();
    router.push(`/active-leads?lead=${leadId}`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[160]" onClick={onClose} />
      <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 pointer-events-none">
        <div className="box custom-box mb-0 w-full max-w-lg pointer-events-auto shadow-lg">
          <div className="box-header border-b border-defaultborder dark:border-defaultborder/10">
            <h6 className="box-title mb-0 before:!hidden">New active lead</h6>
            <button
              type="button"
              className="ti-btn ti-btn-sm ti-btn-icon ti-btn-light"
              onClick={onClose}
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
          <div className="box-body grid grid-cols-12 gap-3">
            <div className="col-span-12">
              <label className="form-label text-[0.75rem]">Company</label>
              <select
                className="form-select form-select-sm"
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setContactId("");
                }}
              >
                <option value="">Select company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {companies.length === 0 && (
                <p className="text-[0.75rem] text-warning mt-1 mb-0">
                  Save a company from Lead Discovery first.
                </p>
              )}
            </div>
            {companyContacts.length > 0 && (
              <div className="col-span-12">
                <label className="form-label text-[0.75rem]">Contact</label>
                <select
                  className="form-select form-select-sm"
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                >
                  <option value="">No contact</option>
                  {companyContacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-span-12">
              <label className="form-label text-[0.75rem]">Lead title</label>
              <input
                className="form-control form-control-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Budesonide supply — ABC Pharma"
              />
            </div>
            <div className="col-span-6">
              <label className="form-label text-[0.75rem]">Salt</label>
              <input
                className="form-control form-control-sm"
                value={matchedSalt}
                onChange={(e) => setMatchedSalt(e.target.value)}
              />
            </div>
            <div className="col-span-6">
              <label className="form-label text-[0.75rem]">Medicine</label>
              <input
                className="form-control form-control-sm"
                value={matchedMedicine}
                onChange={(e) => setMatchedMedicine(e.target.value)}
              />
            </div>
            <div className="col-span-6">
              <label className="form-label text-[0.75rem]">Dosage form</label>
              <input
                className="form-control form-control-sm"
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
              />
            </div>
            <div className="col-span-6">
              <label className="form-label text-[0.75rem]">Stage</label>
              <select
                className="form-select form-select-sm"
                value={stage}
                onChange={(e) => setStage(e.target.value as LeadStage)}
              >
                {LEAD_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-12">
              <label className="form-label text-[0.75rem]">Assignee</label>
              <select
                className="form-select form-select-sm"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                {DEFAULT_ASSIGNEES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="box-footer flex justify-end gap-2 border-t border-defaultborder dark:border-defaultborder/10">
            <button type="button" className="ti-btn ti-btn-light" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="ti-btn ti-btn-primary"
              disabled={!companyId || !title.trim()}
              onClick={handleCreate}
            >
              Create lead
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
