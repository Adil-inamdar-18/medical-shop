"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Field, { inputClass } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/ui/Feedback";
import { createCustomer, updateCustomer } from "@/lib/api";
import type { Customer } from "@/types/customer";

interface CustomerFormModalProps {
  /** Pass a customer to edit it, leave empty to add a new one. */
  customer?: Customer | null;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}

type FormState = {
  store_name: string;
  customer_name: string;
  mobile: string;
  address: string;
  city: string;
  gst_number: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: CustomerFormModalProps) {
  const isEdit = Boolean(customer);

  const [form, setForm] = useState<FormState>({
    store_name: customer?.store_name ?? "",
    customer_name: customer?.customer_name ?? "",
    mobile: customer?.mobile ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    gst_number: customer?.gst_number ?? "",
    notes: customer?.notes ?? "",
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

    if (!form.store_name.trim()) next.store_name = "Store name is required";
    if (!form.customer_name.trim())
      next.customer_name = "Customer name is required";
    if (!form.address.trim()) next.address = "Address is required";
    if (!form.city.trim()) next.city = "City is required";

    if (!form.mobile.trim()) {
      next.mobile = "Mobile number is required";
    } else if (form.mobile.replace(/\D/g, "").length < 10) {
      next.mobile = "Enter a valid mobile number";
    }

    const gst = form.gst_number.trim();
    if (gst && !/^[0-9A-Za-z]{15}$/.test(gst)) {
      next.gst_number = "GST number must be 15 characters";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSaving(true);

    const payload = {
      store_name: form.store_name.trim(),
      customer_name: form.customer_name.trim(),
      mobile: form.mobile.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      gst_number: form.gst_number.trim(),
      notes: form.notes.trim(),
    };

    try {
      const saved = customer
        ? await updateCustomer(customer._id, payload)
        : await createCustomer(payload);

      onSaved(saved);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save customer",
      );
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Customer" : "Add Customer"}
      description={
        isEdit
          ? "Update the details of this customer."
          : "Add a new medical store customer."
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && <ErrorBanner message={submitError} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store Name" required error={errors.store_name}>
            <input
              autoFocus
              value={form.store_name}
              onChange={(e) => setField("store_name", e.target.value)}
              placeholder="Apollo Medical Store"
              className={inputClass}
            />
          </Field>

          <Field label="Customer Name" required error={errors.customer_name}>
            <input
              value={form.customer_name}
              onChange={(e) => setField("customer_name", e.target.value)}
              placeholder="Rajesh Kumar"
              className={inputClass}
            />
          </Field>

          <Field label="Mobile" required error={errors.mobile}>
            <input
              type="tel"
              inputMode="tel"
              value={form.mobile}
              onChange={(e) => setField("mobile", e.target.value)}
              placeholder="9876543210"
              className={inputClass}
            />
          </Field>

          <Field label="City" required error={errors.city}>
            <input
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="Pune"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Address" required error={errors.address}>
          <input
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Shop no, street, area"
            className={inputClass}
          />
        </Field>

        <Field
          label="GST Number"
          error={errors.gst_number}
          hint="Optional - 15 characters"
        >
          <input
            value={form.gst_number}
            onChange={(e) => setField("gst_number", e.target.value)}
            placeholder="27ABCDE1234F1Z5"
            maxLength={15}
            className={`${inputClass} uppercase`}
          />
        </Field>

        <Field label="Notes">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Anything worth remembering about this customer"
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
            {isEdit ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
