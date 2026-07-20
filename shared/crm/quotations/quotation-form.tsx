"use client";

import type { DiscoveryMedicine } from "@/shared/crm/store/medicines-master";
import type { CrmQuotation } from "@/shared/crm/store/types";
import {
  QUOTATION_CURRENCIES,
  QUOTATION_GST_RATES,
  QUOTATION_PRICE_BASES,
  QUOTATION_STATUSES,
} from "@/shared/crm/store/types";
import { todayIso } from "@/shared/crm/store/workflow";

export type QuotationFormModel = {
  productId: string;
  quoteDate: string;
  casNo: string;
  hsnSac: string;
  qty: string;
  unitPrice: string;
  currency: string;
  gstRate: string;
  priceBasis: string;
  validUntil: string;
  status: string;
  note: string;
};

export function emptyQuotationForm(): QuotationFormModel {
  return {
    productId: "",
    quoteDate: todayIso(),
    casNo: "",
    hsnSac: "",
    qty: "",
    unitPrice: "",
    currency: "INR",
    gstRate: "",
    priceBasis: "",
    validUntil: "",
    status: "Draft",
    note: "",
  };
}

export function quotationToForm(q: CrmQuotation): QuotationFormModel {
  return {
    productId: q.productId,
    quoteDate: q.quoteDate,
    casNo: q.casNo,
    hsnSac: q.hsnSac,
    qty: q.qty,
    unitPrice: q.unitPrice,
    currency: q.currency,
    gstRate: q.gstRate,
    priceBasis: q.priceBasis,
    validUntil: q.validUntil,
    status: q.status,
    note: q.note,
  };
}

export type QuotationInput = Omit<
  CrmQuotation,
  | "id"
  | "leadId"
  | "companyId"
  | "companyName"
  | "owner"
  | "quoteNo"
  | "createdAt"
>;

export function inputToQuotationForm(input: QuotationInput): QuotationFormModel {
  return {
    productId: input.productId,
    quoteDate: input.quoteDate,
    casNo: input.casNo,
    hsnSac: input.hsnSac,
    qty: input.qty,
    unitPrice: input.unitPrice,
    currency: input.currency,
    gstRate: input.gstRate,
    priceBasis: input.priceBasis,
    validUntil: input.validUntil,
    status: input.status,
    note: input.note,
  };
}

function parseGstPercent(gstRate: string): number {
  const m = gstRate.match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

/** v1 single line: subTotal = qty × unitPrice; GST optional from gstRate string. */
export function computeQuotationTotals(
  qty: string,
  unitPrice: string,
  gstRate: string
): Pick<QuotationInput, "subTotal" | "gstAmount" | "grandTotal"> {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(unitPrice) || 0;
  const subTotal = q * p;
  const gstPct = parseGstPercent(gstRate);
  const gstAmount = gstPct > 0 ? (subTotal * gstPct) / 100 : 0;
  return {
    subTotal,
    gstAmount,
    grandTotal: subTotal + gstAmount,
  };
}

export function nextQuoteNo(existing: Pick<CrmQuotation, "quoteNo">[]): string {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;
  const nums = existing
    .map((q) => q.quoteNo)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function buildQuotationInput(
  form: QuotationFormModel,
  medicines: DiscoveryMedicine[]
): QuotationInput {
  const product =
    medicines.find((m) => m.id === form.productId)?.name ?? form.productId;
  const quoteDate = form.quoteDate.trim() || todayIso();
  const totals = computeQuotationTotals(form.qty, form.unitPrice, form.gstRate);
  return {
    productId: form.productId,
    product,
    quoteDate,
    casNo: form.casNo.trim(),
    hsnSac: form.hsnSac.trim(),
    qty: form.qty.trim(),
    unitPrice: form.unitPrice.trim(),
    currency: form.currency,
    gstRate: form.gstRate,
    priceBasis: form.priceBasis,
    validUntil: form.validUntil.trim(),
    status: form.status,
    note: form.note.trim(),
    ...totals,
  };
}

export function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "—";
  return `${currency} ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type Props = {
  form: QuotationFormModel;
  onChange: (patch: Partial<QuotationFormModel>) => void;
  medicines: DiscoveryMedicine[];
  idPrefix?: string;
};

export function QuotationFormFields({
  form,
  onChange,
  medicines,
  idPrefix = "qt",
}: Props) {
  const preview = computeQuotationTotals(form.qty, form.unitPrice, form.gstRate);

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12 md:col-span-4">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-product`}>
          First product
        </label>
        <select
          id={`${idPrefix}-product`}
          className="form-select"
          value={form.productId}
          onChange={(e) => onChange({ productId: e.target.value })}
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
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-date`}>
          Quote date
        </label>
        <input
          id={`${idPrefix}-date`}
          type="date"
          className="form-control"
          value={form.quoteDate}
          onChange={(e) => onChange({ quoteDate: e.target.value })}
        />
      </div>
      <div className="col-span-12 md:col-span-4">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-cas`}>
          CAS no.
        </label>
        <input
          id={`${idPrefix}-cas`}
          className="form-control"
          placeholder="e.g. 520-85-4"
          value={form.casNo}
          onChange={(e) => onChange({ casNo: e.target.value })}
        />
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-hsn`}>
          HSN/SAC code
        </label>
        <input
          id={`${idPrefix}-hsn`}
          className="form-control"
          placeholder="e.g. 29372900"
          value={form.hsnSac}
          onChange={(e) => onChange({ hsnSac: e.target.value })}
        />
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-qty`}>
          Quantity (kg)
        </label>
        <input
          id={`${idPrefix}-qty`}
          type="number"
          min={0}
          className="form-control"
          value={form.qty}
          onChange={(e) => onChange({ qty: e.target.value })}
        />
      </div>
      <div className="col-span-12 md:col-span-4">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-price`}>
          Unit price (per kg)
        </label>
        <input
          id={`${idPrefix}-price`}
          type="number"
          min={0}
          step="0.01"
          className="form-control"
          value={form.unitPrice}
          onChange={(e) => onChange({ unitPrice: e.target.value })}
        />
      </div>
      <div className="col-span-12 md:col-span-4">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-currency`}>
          Currency
        </label>
        <select
          id={`${idPrefix}-currency`}
          className="form-select"
          value={form.currency}
          onChange={(e) => onChange({ currency: e.target.value })}
        >
          {QUOTATION_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-12 md:col-span-4">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-gst`}>
          GST rate
        </label>
        <select
          id={`${idPrefix}-gst`}
          className="form-select"
          value={form.gstRate}
          onChange={(e) => onChange({ gstRate: e.target.value })}
        >
          {QUOTATION_GST_RATES.map((g) => (
            <option key={g || "none"} value={g}>
              {g || "— (no GST line)"}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-basis`}>
          Price basis
        </label>
        <select
          id={`${idPrefix}-basis`}
          className="form-select"
          value={form.priceBasis}
          onChange={(e) => onChange({ priceBasis: e.target.value })}
        >
          {QUOTATION_PRICE_BASES.map((p) => (
            <option key={p || "empty"} value={p}>
              {p || "—"}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-valid`}>
          Valid until
        </label>
        <input
          id={`${idPrefix}-valid`}
          type="date"
          className="form-control"
          value={form.validUntil}
          onChange={(e) => onChange({ validUntil: e.target.value })}
        />
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-status`}>
          Status
        </label>
        <select
          id={`${idPrefix}-status`}
          className="form-select"
          value={form.status}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          {QUOTATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className="form-label text-[0.75rem]" htmlFor={`${idPrefix}-note`}>
          Note (printed under item table)
        </label>
        <input
          id={`${idPrefix}-note`}
          className="form-control"
          value={form.note}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </div>
      {(form.qty || form.unitPrice) && (
        <div className="col-span-12">
          <p className="text-[0.75rem] text-textmuted mb-0">
            Sub total: {formatMoney(preview.subTotal, form.currency)}
            {preview.gstAmount > 0 &&
              ` · GST: ${formatMoney(preview.gstAmount, form.currency)}`}
            {" · Grand total: "}
            {formatMoney(preview.grandTotal, form.currency)}
          </p>
        </div>
      )}
    </div>
  );
}
