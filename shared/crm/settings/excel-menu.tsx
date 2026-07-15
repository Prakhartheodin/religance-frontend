"use client";

import { useCrm } from "@/shared/crm/store/crm-context";
import {
  importBuyerExcel,
  listBackendMasterData,
} from "@/shared/crm/store/outlook-api";
import { useRef, useState } from "react";
import { BUYER_HEADERS, TEMPLATE_ROWS, buyersToRows, type BuyerRow } from "./excel-io";

type Status = { kind: "info" | "success" | "danger"; text: string } | null;

const SHEET_NAME = "Buyer Master";

async function writeWorkbook(rows: BuyerRow[], filename: string) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: BUYER_HEADERS as unknown as string[],
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  XLSX.writeFile(wb, filename);
}

export default function ExcelMenu() {
  const { refreshMasterData } = useCrm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const flash = (s: Status, ms = 6000) => {
    setStatus(s);
    if (s) window.setTimeout(() => setStatus(null), ms);
  };

  const handleExport = async () => {
    try {
      const res = await listBackendMasterData();
      if (!res.live) {
        flash({ kind: "danger", text: res.error });
        return;
      }
      if (!res.data.buyers.length) {
        flash({ kind: "info", text: "No buyers to export yet." });
        return;
      }
      await writeWorkbook(buyersToRows(res.data.buyers), "buyer-master.xlsx");
      flash({
        kind: "success",
        text: `Exported ${res.data.buyers.length} buyers.`,
      });
    } catch {
      flash({ kind: "danger", text: "Export failed." });
    }
  };

  const handleTemplate = async () => {
    try {
      await writeWorkbook(TEMPLATE_ROWS, "buyer-master-template.xlsx");
      flash({ kind: "success", text: "Template downloaded." });
    } catch {
      flash({ kind: "danger", text: "Could not create template." });
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;

    setBusy(true);
    flash({ kind: "info", text: `Importing ${file.name}…` }, 60000);
    const res = await importBuyerExcel(file);
    if (!res.live) {
      flash({ kind: "danger", text: res.error });
      setBusy(false);
      return;
    }
    await refreshMasterData(); // pull the freshly upserted salts/medicines
    const d = res.data;
    flash({
      kind: "success",
      text: `Imported ${d.buyers} buyers · ${d.salts} salts · ${d.medicines} medicines from ${d.sourceFile}.`,
    });
    setBusy(false);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFile}
      />

      <div className="hs-dropdown ti-dropdown">
        <button
          type="button"
          className="ti-btn ti-btn-outline-success !py-1.5 !px-3 !text-[0.8125rem] !w-auto !h-auto !mb-0 flex items-center"
          aria-expanded="false"
          disabled={busy}
        >
          <i className="ri-file-excel-2-line me-1"></i>
          {busy ? "Importing…" : "Excel"}
          <i className="ri-arrow-down-s-line ms-1"></i>
        </button>
        <ul className="hs-dropdown-menu ti-dropdown-menu hidden">
          <li>
            <button
              type="button"
              className="ti-dropdown-item !py-2 !px-[0.9375rem] !text-[0.8125rem] !font-medium w-full text-start flex items-center"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              <i className="ri-upload-2-line me-2 text-textmuted"></i>
              Import buyers
            </button>
          </li>
          <li>
            <button
              type="button"
              className="ti-dropdown-item !py-2 !px-[0.9375rem] !text-[0.8125rem] !font-medium w-full text-start flex items-center"
              onClick={handleExport}
            >
              <i className="ri-download-2-line me-2 text-textmuted"></i>
              Export
            </button>
          </li>
          <li>
            <button
              type="button"
              className="ti-dropdown-item !py-2 !px-[0.9375rem] !text-[0.8125rem] !font-medium w-full text-start flex items-center"
              onClick={handleTemplate}
            >
              <i className="ri-file-download-line me-2 text-textmuted"></i>
              Download template
            </button>
          </li>
        </ul>
      </div>

      {status && (
        <div
          className={`fixed bottom-6 right-6 z-[200] max-w-xs rounded-md px-4 py-3 text-[0.8125rem] shadow-lg border
            ${
              status.kind === "success"
                ? "bg-success/10 border-success/20 text-success"
                : status.kind === "danger"
                  ? "bg-danger/10 border-danger/20 text-danger"
                  : "bg-light border-defaultborder text-defaulttextcolor"
            }`}
          role="status"
        >
          {status.text}
        </div>
      )}
    </>
  );
}
