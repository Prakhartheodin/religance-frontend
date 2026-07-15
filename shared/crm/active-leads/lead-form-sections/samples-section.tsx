"use client";

import { useCrm } from "@/shared/crm/store/crm-context";
import { useState } from "react";
import {
  LeadFormDataTable,
  LeadFormSectionShell,
} from "./lead-form-section-shell";

const SAMPLE_STATUSES = [
  "Requested",
  "Dispatched",
  "In transit",
  "Delivered",
  "Feedback received",
  "Cancelled",
] as const;

type SampleRow = {
  id: string;
  product: string;
  qty: string;
  batchNo: string;
  dispatched: string;
  courierAwb: string;
  coa: string;
  status: string;
  feedback: string;
};

const emptyForm = () => ({
  productId: "",
  qty: "",
  batchNo: "",
  status: "Requested",
  dispatchDate: "",
  courier: "",
  awb: "",
  coaSent: false,
});

export function SamplesSection() {
  const { medicines } = useCrm();
  const [rows, setRows] = useState<SampleRow[]>([]);
  const [form, setForm] = useState(emptyForm);

  const handleRecord = () => {
    if (!form.productId) return;
    const product =
      medicines.find((m) => m.id === form.productId)?.name ?? form.productId;
    const courierAwb = [form.courier, form.awb].filter(Boolean).join(" / ") || "—";
    setRows((prev) => [
      {
        id: `sm-${Date.now()}`,
        product,
        qty: form.qty.trim() || "—",
        batchNo: form.batchNo.trim() || "—",
        dispatched: form.dispatchDate.trim() || "—",
        courierAwb,
        coa: form.coaSent ? "Yes" : "No",
        status: form.status,
        feedback: "—",
      },
      ...prev,
    ]);
    setForm(emptyForm());
  };

  return (
    <LeadFormSectionShell title="Samples" badge="UI preview">
      <LeadFormDataTable
        columns={[
          "Product",
          "Qty",
          "Batch no.",
          "Dispatched",
          "Courier / AWB",
          "CoA",
          "Status",
          "Customer feedback",
        ]}
        emptyMessage="No samples recorded for this lead yet."
        rows={rows.map((r) => [
          r.product,
          r.qty,
          r.batchNo,
          r.dispatched,
          r.courierAwb,
          r.coa,
          r.status,
          r.feedback,
        ])}
      />

      <div className="lead-form-subgroup mt-4">
        <h6 className="text-[0.8125rem] font-semibold mb-3">Record sample</h6>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="sm-product">
              Product
            </label>
            <select
              id="sm-product"
              className="form-select"
              value={form.productId}
              onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
            >
              <option value="">—</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="sm-qty">
              Quantity
            </label>
            <input
              id="sm-qty"
              className="form-control"
              placeholder="e.g. 2 x 10 g"
              value={form.qty}
              onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="sm-batch">
              Batch no.
            </label>
            <input
              id="sm-batch"
              className="form-control"
              value={form.batchNo}
              onChange={(e) => setForm((f) => ({ ...f, batchNo: e.target.value }))}
            />
          </div>
          <div className="col-span-12">
            <label className="form-label text-[0.75rem]" htmlFor="sm-status">
              Status
            </label>
            <select
              id="sm-status"
              className="form-select"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {SAMPLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="sm-dispatch">
              Dispatch date
            </label>
            <input
              id="sm-dispatch"
              className="form-control"
              placeholder="DD-MM-YYYY"
              value={form.dispatchDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, dispatchDate: e.target.value }))
              }
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="sm-courier">
              Courier
            </label>
            <input
              id="sm-courier"
              className="form-control"
              value={form.courier}
              onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="sm-awb">
              AWB / tracking no.
            </label>
            <input
              id="sm-awb"
              className="form-control"
              value={form.awb}
              onChange={(e) => setForm((f) => ({ ...f, awb: e.target.value }))}
            />
          </div>
          <div className="col-span-12">
            <label className="flex items-center gap-2 text-[0.8125rem] cursor-pointer min-h-[2.75rem]">
              <input
                type="checkbox"
                className="form-check-input"
                checked={form.coaSent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coaSent: e.target.checked }))
                }
              />
              CoA sent with sample
            </label>
          </div>
          <div className="col-span-12 flex justify-end">
            <button
              type="button"
              className="ti-btn ti-btn-primary !min-h-[2.75rem]"
              onClick={handleRecord}
              disabled={!form.productId}
            >
              Record sample
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
