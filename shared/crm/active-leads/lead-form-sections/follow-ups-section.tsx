"use client";

import { getUserDisplayName } from "@/shared/auth/auth-client";
import { useState } from "react";
import {
  LeadFormDataTable,
  LeadFormSectionShell,
} from "./lead-form-section-shell";

const FOLLOW_UP_MODES = [
  "",
  "Call",
  "Email",
  "WhatsApp",
  "Meeting",
  "Site visit",
  "Other",
] as const;

const FOLLOW_UP_OUTCOMES = [
  "",
  "Positive",
  "Neutral",
  "No response",
  "Follow-up needed",
  "Closed",
] as const;

type FollowUpRow = {
  id: string;
  entryDate: string;
  contactedBy: string;
  mode: string;
  summary: string;
  outcome: string;
  nextStep: string;
  nextFollowUp: string;
};

const emptyForm = () => ({
  entryDate: "",
  mode: "",
  outcome: "",
  summary: "",
  infoShared: "",
  nextStep: "",
  nextFollowUp: "",
});

export function FollowUpsSection() {
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [form, setForm] = useState(emptyForm);

  const handleAdd = () => {
    if (!form.summary.trim() && !form.mode) return;
    const entryDate =
      form.entryDate.trim() ||
      new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    setRows((prev) => [
      {
        id: `fu-${Date.now()}`,
        entryDate,
        contactedBy: getUserDisplayName() || "—",
        mode: form.mode || "—",
        summary: form.summary.trim() || "—",
        outcome: form.outcome || "—",
        nextStep: form.nextStep.trim() || "—",
        nextFollowUp: form.nextFollowUp.trim() || "—",
      },
      ...prev,
    ]);
    setForm(emptyForm());
  };

  return (
    <LeadFormSectionShell title="Follow-ups" badge="UI preview">
      <LeadFormDataTable
        columns={[
          "Entry date",
          "Contacted by",
          "Mode",
          "Summary",
          "Outcome",
          "Next step",
          "Next follow-up",
        ]}
        emptyMessage="No follow-ups logged yet."
        rows={rows.map((r) => [
          r.entryDate,
          r.contactedBy,
          r.mode,
          <span key="s" className="max-w-[12rem] truncate block" title={r.summary}>
            {r.summary}
          </span>,
          r.outcome,
          r.nextStep,
          r.nextFollowUp,
        ])}
      />

      <div className="lead-form-subgroup mt-4">
        <h6 className="text-[0.8125rem] font-semibold mb-3">Add follow-up</h6>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="fu-entry-date">
              Entry date
            </label>
            <input
              id="fu-entry-date"
              className="form-control"
              placeholder="DD-MM-YYYY (blank = today)"
              value={form.entryDate}
              onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="fu-mode">
              Mode
            </label>
            <select
              id="fu-mode"
              className="form-select"
              value={form.mode}
              onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
            >
              {FOLLOW_UP_MODES.map((m) => (
                <option key={m || "empty"} value={m}>
                  {m || "—"}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="fu-outcome">
              Outcome
            </label>
            <select
              id="fu-outcome"
              className="form-select"
              value={form.outcome}
              onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
            >
              {FOLLOW_UP_OUTCOMES.map((o) => (
                <option key={o || "empty"} value={o}>
                  {o || "—"}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12">
            <label className="form-label text-[0.75rem]" htmlFor="fu-summary">
              Discussion summary
            </label>
            <textarea
              id="fu-summary"
              className="form-control"
              rows={3}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            />
          </div>
          <div className="col-span-12">
            <label className="form-label text-[0.75rem]" htmlFor="fu-info">
              Info / docs shared
            </label>
            <input
              id="fu-info"
              className="form-control"
              value={form.infoShared}
              onChange={(e) => setForm((f) => ({ ...f, infoShared: e.target.value }))}
            />
          </div>
          <div className="col-span-12">
            <label className="form-label text-[0.75rem]" htmlFor="fu-next-step">
              Next step agreed
            </label>
            <input
              id="fu-next-step"
              className="form-control"
              value={form.nextStep}
              onChange={(e) => setForm((f) => ({ ...f, nextStep: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="form-label text-[0.75rem]" htmlFor="fu-next-date">
              Next follow-up date
            </label>
            <input
              id="fu-next-date"
              className="form-control"
              placeholder="DD-MM-YYYY"
              value={form.nextFollowUp}
              onChange={(e) => setForm((f) => ({ ...f, nextFollowUp: e.target.value }))}
            />
          </div>
          <div className="col-span-12 flex justify-end">
            <button
              type="button"
              className="ti-btn ti-btn-primary !min-h-[2.75rem]"
              onClick={handleAdd}
            >
              Add follow-up
            </button>
          </div>
        </div>
        <p className="text-[0.75rem] text-textmuted mb-0 mt-3">
          Saved with the lead in a future release — entries here are session-only for now.
        </p>
      </div>
    </LeadFormSectionShell>
  );
}
