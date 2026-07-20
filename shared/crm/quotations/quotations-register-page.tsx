"use client";

import {
  buildQuotationInput,
  emptyQuotationForm,
  formatMoney,
  QuotationFormFields,
  quotationToForm,
  type QuotationFormModel,
} from "@/shared/crm/quotations/quotation-form";
import { LeadFormRowActions } from "@/shared/crm/active-leads/lead-form-sections/lead-form-section-shell";
import { useCrm } from "@/shared/crm/store/crm-context";
import type { CrmQuotation } from "@/shared/crm/store/types";
import {
  QUOTATION_CURRENCIES,
  QUOTATION_STATUSES,
} from "@/shared/crm/store/types";
import { ConfirmDeleteOverlay } from "@/shared/crm/ui/confirm-delete-overlay";
import Seo from "@/shared/layout-components/seo/seo";
import { Fragment, useMemo, useState } from "react";

const dash = (v: string | null | undefined) => (v?.trim() ? v : "—");

type EditorState = { quotation: CrmQuotation | null } | null;

export default function QuotationsRegisterPage() {
  const {
    quotations,
    leads,
    medicines,
    hydrated,
    addQuotation,
    updateQuotation,
    deleteQuotation,
  } = useCrm();

  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");
  const [owner, setOwner] = useState("");
  const [editor, setEditor] = useState<EditorState>(null);
  const [pendingDelete, setPendingDelete] = useState<CrmQuotation | null>(null);

  const ownerOptions = useMemo(
    () => [...new Set(quotations.map((q) => q.owner).filter(Boolean))].sort(),
    [quotations]
  );

  const filtered = useMemo(
    () =>
      quotations.filter(
        (q) =>
          (!status || q.status === status) &&
          (!currency || q.currency === currency) &&
          (!owner || q.owner === owner)
      ),
    [quotations, status, currency, owner]
  );

  const filtersActive = Boolean(status || currency || owner);
  const clearFilters = () => {
    setStatus("");
    setCurrency("");
    setOwner("");
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteQuotation(pendingDelete.id);
    setPendingDelete(null);
  };

  if (!hydrated) {
    return <div className="p-6 text-textmuted">Loading quotations…</div>;
  }

  return (
    <Fragment>
      <Seo title="Quotations" />
      <div className="p-2 sm:p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <div>
            <h1 className="text-[1.25rem] font-semibold mb-1">Quotation Register</h1>
            <p className="text-textmuted text-[0.8125rem] mb-0">
              All quotations issued across leads. Filter by status, currency, or owner.
            </p>
          </div>
          <button
            type="button"
            className="ti-btn ti-btn-primary shrink-0"
            onClick={() => setEditor({ quotation: null })}
            disabled={leads.length === 0}
            title={leads.length === 0 ? "Create a lead first" : undefined}
          >
            <i className="ri-add-line me-1"></i>Add quotation
          </button>
        </div>

        <div className="box custom-box mb-4">
          <div className="box-body">
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-12 sm:col-span-4">
                <label className="form-label text-[0.75rem]">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All</option>
                  {QUOTATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="form-label text-[0.75rem]">Currency</label>
                <select
                  className="form-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="">All</option>
                  {QUOTATION_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="form-label text-[0.75rem]">Owner</label>
                <select
                  className="form-select"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                >
                  <option value="">All</option>
                  {ownerOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              {filtersActive && (
                <div className="col-span-12">
                  <button
                    type="button"
                    className="ti-btn ti-btn-sm ti-btn-light"
                    onClick={clearFilters}
                  >
                    <i className="ri-filter-off-line me-1"></i>Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="box custom-box">
          <div className="box-body p-0">
            <div className="table-responsive">
              <table className="table ti-custom-table min-w-full mb-0 text-[0.8125rem]">
                <thead className="ti-custom-table-head">
                  <tr>
                    {[
                      "Quote No.",
                      "Date",
                      "Company",
                      "Products",
                      "Sub total",
                      "GST",
                      "Grand total",
                      "Basis",
                      "Valid until",
                      "Status",
                      "Owner",
                      "",
                    ].map((c) => (
                      <th
                        key={c}
                        className="text-[0.6875rem] uppercase tracking-wide whitespace-nowrap"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center text-textmuted py-6">
                        {quotations.length === 0
                          ? "No quotations yet. Issue quotes from a lead's detail page."
                          : "No quotations match these filters. Issue quotes from a lead's detail page."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((q) => (
                      <tr key={q.id}>
                        <td className="align-middle whitespace-nowrap">{dash(q.quoteNo)}</td>
                        <td className="align-middle">{dash(q.quoteDate)}</td>
                        <td className="align-middle">{dash(q.companyName)}</td>
                        <td className="align-middle">{dash(q.product)}</td>
                        <td className="align-middle whitespace-nowrap">
                          {formatMoney(q.subTotal, q.currency)}
                        </td>
                        <td className="align-middle whitespace-nowrap">
                          {q.gstAmount > 0
                            ? formatMoney(q.gstAmount, q.currency)
                            : "—"}
                        </td>
                        <td className="align-middle whitespace-nowrap">
                          {formatMoney(q.grandTotal, q.currency)}
                        </td>
                        <td className="align-middle">{dash(q.priceBasis)}</td>
                        <td className="align-middle">{dash(q.validUntil)}</td>
                        <td className="align-middle">
                          <span className="badge bg-light text-default">{q.status}</span>
                        </td>
                        <td className="align-middle">{dash(q.owner)}</td>
                        <td className="align-middle text-end whitespace-nowrap">
                          <LeadFormRowActions
                            onEdit={() => setEditor({ quotation: q })}
                            onDelete={() => setPendingDelete(q)}
                            editAriaLabel={`Edit quotation ${q.quoteNo}`}
                            deleteAriaLabel={`Delete quotation ${q.quoteNo}`}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editor && (
        <QuotationEditorModal
          quotation={editor.quotation}
          onClose={() => setEditor(null)}
          onSave={(leadId, form) => {
            const input = buildQuotationInput(form, medicines);
            if (editor.quotation) {
              updateQuotation(editor.quotation.id, { ...input, leadId });
            } else {
              addQuotation(leadId, input);
            }
            setEditor(null);
          }}
        />
      )}

      <ConfirmDeleteOverlay
        open={pendingDelete != null}
        entityName={
          pendingDelete
            ? `${pendingDelete.quoteNo || "Quotation"} · ${pendingDelete.companyName}`
            : "this quotation"
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Fragment>
  );
}

function QuotationEditorModal({
  quotation,
  onClose,
  onSave,
}: {
  quotation: CrmQuotation | null;
  onClose: () => void;
  onSave: (leadId: string, form: QuotationFormModel) => void;
}) {
  const { leads, medicines } = useCrm();
  const [leadId, setLeadId] = useState(quotation?.leadId ?? "");
  const [form, setForm] = useState<QuotationFormModel>(
    quotation ? quotationToForm(quotation) : emptyQuotationForm()
  );

  const leadOptions = useMemo(
    () =>
      [...leads].sort((a, b) =>
        (a.companyName || a.title).localeCompare(b.companyName || b.title)
      ),
    [leads]
  );
  const selectedLead = leads.find((l) => l.id === leadId);
  const canSave = Boolean(leadId && form.productId);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="box custom-box w-full max-w-2xl max-h-[90vh] overflow-y-auto mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="box-header flex items-center justify-between">
          <h6 className="box-title mb-0">
            {quotation ? "Edit quotation" : "Add quotation"}
          </h6>
          <button
            type="button"
            className="ti-btn ti-btn-sm ti-btn-light"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
        <div className="box-body">
          <div className="mb-3">
            <label className="form-label text-[0.75rem]" htmlFor="qt-lead">
              Lead
            </label>
            <select
              id="qt-lead"
              className="form-select"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              <option value="">Select a lead…</option>
              {leadOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {(l.companyName || l.title) +
                    (l.matchedMedicine ? ` · ${l.matchedMedicine}` : "")}
                </option>
              ))}
            </select>
            {selectedLead && (
              <p className="text-[0.75rem] text-textmuted mb-0 mt-1">
                Owner: {selectedLead.assignedTo || "—"}
              </p>
            )}
          </div>
          {quotation && (
            <p className="text-[0.75rem] text-textmuted mb-3">
              Quote no.: {quotation.quoteNo}
            </p>
          )}
          <QuotationFormFields
            form={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            medicines={medicines}
            idPrefix="qt-modal"
          />
        </div>
        <div className="box-footer flex justify-end gap-2">
          <button type="button" className="ti-btn ti-btn-light" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ti-btn ti-btn-primary"
            disabled={!canSave}
            onClick={() => onSave(leadId, form)}
          >
            {quotation ? "Save changes" : "Add quotation"}
          </button>
        </div>
      </div>
    </div>
  );
}
