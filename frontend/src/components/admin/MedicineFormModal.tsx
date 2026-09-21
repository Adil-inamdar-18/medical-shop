"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Field, { inputClass } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/ui/Feedback";
import { createMedicine, updateMedicine } from "@/lib/api";
import type { Medicine } from "@/types/medicine";

interface MedicineFormModalProps {
  /** Pass a medicine to edit it, leave empty to add a new one. */
  medicine?: Medicine | null;
  onClose: () => void;
  onSaved: (medicine: Medicine) => void;
}

type FormState = {
  medicine_name: string;
  price: string;
  stock: string;
  manufacturer: string;
  category: string;
  expiry_date: string;
  description: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function MedicineFormModal({
  medicine,
  onClose,
  onSaved,
}: MedicineFormModalProps) {
  const isEdit = Boolean(medicine);

  const [form, setForm] = useState<FormState>({
    medicine_name: medicine?.medicine_name ?? "",
    price: medicine ? String(medicine.price) : "",
    stock: medicine ? String(medicine.stock) : "",
    manufacturer: medicine?.manufacturer ?? "",
    category: medicine?.category ?? "",
    expiry_date: medicine?.expiry_date ? medicine.expiry_date.slice(0, 10) : "",
    description: medicine?.description ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setField = (name: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const validate = () => {
    const next: FormErrors = {};

    if (!form.medicine_name.trim())
      next.medicine_name = "Medicine name is required";

    if (form.price.trim() === "" || Number(form.price) < 0)
      next.price = "Enter a price of 0 or more";

    if (
      form.stock.trim() === "" ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    )
      next.stock = "Enter a whole number of 0 or more";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSaving(true);

    const payload = {
      medicine_name: form.medicine_name.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      manufacturer: form.manufacturer.trim(),
      category: form.category.trim(),
      expiry_date: form.expiry_date || null,
      description: form.description.trim(),
    };

    try {
      const saved = medicine
        ? await updateMedicine(medicine._id, payload)
        : await createMedicine(payload);

      onSaved(saved);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save medicine",
      );
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Medicine" : "Add Medicine"}
      description="Stock is only ever changed here or from the inventory table."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && <ErrorBanner message={submitError} />}

        <Field label="Medicine Name" required error={errors.medicine_name}>
          <input
            autoFocus
            value={form.medicine_name}
            onChange={(e) => setField("medicine_name", e.target.value)}
            placeholder="Paracetamol 500mg"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (₹)" required error={errors.price}>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              placeholder="25"
              className={inputClass}
            />
          </Field>

          <Field label="Stock (units)" required error={errors.stock}>
            <input
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => setField("stock", e.target.value)}
              placeholder="100"
              className={inputClass}
            />
          </Field>

          <Field label="Manufacturer">
            <input
              value={form.manufacturer}
              onChange={(e) => setField("manufacturer", e.target.value)}
              placeholder="Cipla"
              className={inputClass}
            />
          </Field>

          <Field label="Category">
            <input
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              placeholder="Pain relief"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Expiry Date">
          <input
            type="date"
            value={form.expiry_date}
            onChange={(e) => setField("expiry_date", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Add Medicine"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
