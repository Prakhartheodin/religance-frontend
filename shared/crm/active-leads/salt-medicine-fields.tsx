"use client";

import { useCrm } from "@/shared/crm/store/crm-context";
import { useMemo } from "react";

type SaltMedicineFieldsProps = {
  saltId: string;
  medicineId: string;
  onSaltChange: (saltId: string) => void;
  onMedicineChange: (medicineId: string) => void;
  error?: string;
  disabled?: boolean;
};

export function SaltMedicineFields({
  saltId,
  medicineId,
  onSaltChange,
  onMedicineChange,
  error,
  disabled,
}: SaltMedicineFieldsProps) {
  const { salts, medicines } = useCrm();

  const selectedMedicine = useMemo(
    () => medicines.find((m) => m.id === medicineId),
    [medicines, medicineId]
  );

  const availableSalts = useMemo(() => {
    if (!selectedMedicine) return salts;
    return salts.filter((s) => selectedMedicine.saltIds.includes(s.id));
  }, [salts, selectedMedicine]);

  const handleMedicineChange = (nextMedicineId: string) => {
    onMedicineChange(nextMedicineId);
    const med = medicines.find((m) => m.id === nextMedicineId);
    if (!med) {
      onSaltChange("");
      return;
    }
    if (saltId && med.saltIds.includes(saltId)) return;
    onSaltChange(med.saltIds[0] ?? "");
  };

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12 md:col-span-6">
        <label className="form-label text-[0.75rem]" htmlFor="lead-medicine">
          Medicine
        </label>
        <select
          id="lead-medicine"
          className="form-select"
          value={medicineId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(e) => handleMedicineChange(e.target.value)}
        >
          <option value="">Select medicine…</option>
          {medicines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-12 md:col-span-6">
        <label className="form-label text-[0.75rem]" htmlFor="lead-salt">
          Salt
        </label>
        <select
          id="lead-salt"
          className="form-select"
          value={saltId}
          disabled={disabled || !medicineId}
          aria-invalid={Boolean(error)}
          onChange={(e) => onSaltChange(e.target.value)}
        >
          <option value="">Select salt…</option>
          {availableSalts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-[0.75rem] text-danger mt-1 mb-0" role="alert">
            {error}
          </p>
        )}
      </div>
      {selectedMedicine && (
        <div className="col-span-12">
          <label className="form-label text-[0.75rem]">Dosage form</label>
          <p className="form-control bg-light/50 dark:bg-black/20 mb-0 text-[0.875rem]">
            {selectedMedicine.dosageForm || "—"}
          </p>
        </div>
      )}
    </div>
  );
}
