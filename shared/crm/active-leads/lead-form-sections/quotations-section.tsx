"use client";

import { useCrm } from "@/shared/crm/store/crm-context";
import { useState } from "react";
import {
  LeadFormDataTable,
  LeadFormSectionShell,
} from "./lead-form-section-shell";

const CURRENCIES = ["INR", "USD", "EUR"] as const;
const GST_RATES = ["", "0%", "5%", "12%", "18%", "28%"] as const;
const PRICE_BASES = ["", "Ex-works", "FOB", "CIF", "DDP"] as const;
const QUOTE_STATUSES = ["Draft", "Sent", "Accepted", "Rejected", "Expired"] as const;

type QuotationRow = {
  id: string;
  product: string;
  quoteDate: string;
  casNo: string;
  qty: string;
  unitPrice: string;
  currency: string;
  status: string;
};

const emptyForm = () => ({
  productId: "",
  quoteDate: "",
  casNo: "",
  hsn: "",
  qtyKg: "",
  unitPrice: "",
  currency: "INR",
  gstRate: "",
  priceBasis: "",
  validUntil: "",
  status: "Draft",
  note: "",
});

export function QuotationsSection() {
  const { medicines } = useCrm();
  const [rows, setRows] = useState<QuotationRow[]>([]);
  const [form, setForm] = useState(emptyForm);

  const handleCreate = () => {
    if (!form.productId) return;
    const product =
      medicines.find((m) => m.id === form.productId)?.name ?? form.productId;
    const quoteDate =
      form.quoteDate.trim() ||
      new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    setRows((prev) => [
      {
        id: `qt-${Date.now()}`,
        product,
        quoteDate,
        casNo: form.casNo.trim() || "—",
        qty: form.qtyKg.trim() ? `${form.qtyKg} kg` : "—",
        unitPrice: form.unitPrice.trim()
          ? `${form.currency} ${form.unitPrice}/kg`
          : "—",
        currency: form.currency,
        status: form.status,
      },
      ...prev,
    ]);
    setForm(emptyForm());
  };

  return (
    <LeadFormSectionShell title="Quotations" badge="UI preview">
      <LeadFormDataTable
        columns={[
          "Product",
          "Quote date",
          "CAS no.",
          "Quantity",
          "Unit price",
          "Currency",
          "Status",
        ]}
        emptyMessage="No quotations issued to this lead yet."
        rows={rows.map((r) => [
          r.product,
          r.quoteDate,
          r.casNo,
          r.qty,
          r.unitPrice,
          r.currency,
          r.status,
        ])}
      />

      <div className="lead-form-subgroup mt-4">
        <h6 className="text-[0.8125rem] font-semibold mb-1">New quotation</h6>
        <p className="text-[0.75rem] text-textmuted mb-3">
          Number auto-assigned; add more products after creating.
        </p>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="qt-product">
              First product
            </label>
            <select
              id="qt-product"
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
            <label className="form-label text-[0.75rem]" htmlFor="qt-date">
              Quote date
            </label>
            <input
              id="qt-date"
              className="form-control"
              placeholder="DD-MM-YYYY (blank = today)"
              value={form.quoteDate}
              onChange={(e) => setForm((f) => ({ ...f, quoteDate: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="qt-cas">
              CAS no.
            </label>
            <input
              id="qt-cas"
              className="form-control"
              placeholder="e.g. 520-85-4"
              value={form.casNo}
              onChange={(e) => setForm((f) => ({ ...f, casNo: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="form-label text-[0.75rem]" htmlFor="qt-hsn">
              HSN/SAC code
            </label>
            <input
              id="qt-hsn"
              className="form-control"
              placeholder="e.g. 29372900"
              value={form.hsn}
              onChange={(e) => setForm((f) => ({ ...f, hsn: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="form-label text-[0.75rem]" htmlFor="qt-qty">
              Quantity (kg)
            </label>
            <input
              id="qt-qty"
              type="number"
              min={0}
              className="form-control"
              value={form.qtyKg}
              onChange={(e) => setForm((f) => ({ ...f, qtyKg: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="qt-price">
              Unit price (per kg)
            </label>
            <input
              id="qt-price"
              type="number"
              min={0}
              step="0.01"
              className="form-control"
              value={form.unitPrice}
              onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="qt-currency">
              Currency
            </label>
            <select
              id="qt-currency"
              className="form-select"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="form-label text-[0.75rem]" htmlFor="qt-gst">
              GST rate
            </label>
            <select
              id="qt-gst"
              className="form-select"
              value={form.gstRate}
              onChange={(e) => setForm((f) => ({ ...f, gstRate: e.target.value }))}
            >
              {GST_RATES.map((g) => (
                <option key={g || "none"} value={g}>
                  {g || "— (no GST line)"}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="form-label text-[0.75rem]" htmlFor="qt-basis">
              Price basis
            </label>
            <select
              id="qt-basis"
              className="form-select"
              value={form.priceBasis}
              onChange={(e) => setForm((f) => ({ ...f, priceBasis: e.target.value }))}
            >
              {PRICE_BASES.map((p) => (
                <option key={p || "empty"} value={p}>
                  {p || "—"}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="form-label text-[0.75rem]" htmlFor="qt-valid">
              Valid until
            </label>
            <input
              id="qt-valid"
              className="form-control"
              placeholder="DD-MM-YYYY"
              value={form.validUntil}
              onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="form-label text-[0.75rem]" htmlFor="qt-status">
              Status
            </label>
            <select
              id="qt-status"
              className="form-select"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {QUOTE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="form-label text-[0.75rem]" htmlFor="qt-note">
              Note (printed under item table)
            </label>
            <input
              id="qt-note"
              className="form-control"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
          <div className="col-span-12 flex justify-end">
            <button
              type="button"
              className="ti-btn ti-btn-primary !min-h-[2.75rem]"
              onClick={handleCreate}
              disabled={!form.productId}
            >
              Create quotation
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
