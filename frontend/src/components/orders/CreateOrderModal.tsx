"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Loader2, Plus, Trash2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Field, { inputClass } from "@/components/ui/Field";
import { ErrorBanner, LoadingBlock } from "@/components/ui/Feedback";
import { useFetch } from "@/hooks/useFetch";
import { createOrder, getCustomers, getMedicines } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  PAYMENT_STATUSES,
  type Order,
  type PaymentStatus,
} from "@/types/order";

interface CreateOrderModalProps {
  onClose: () => void;
  onSaved: (order: Order) => void;
}

interface Row {
  id: number;
  medicine_id: string;
  quantity: string;
  price: string;
}

const FIXED_GST_PERCENTAGE = 12;

const loadFormData = async () => {
  const [customers, medicines] = await Promise.all([
    getCustomers(),
    getMedicines(),
  ]);

  return { customers, medicines };
};

let nextRowId = 1;

const newRow = (): Row => ({
  id: nextRowId++,
  medicine_id: "",
  quantity: "1",
  price: "",
});

export default function CreateOrderModal({
  onClose,
  onSaved,
}: CreateOrderModalProps) {
  const { data, error: loadError, loading, reload } = useFetch(loadFormData);

  const [customerId, setCustomerId] = useState("");
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [amountPaid, setAmountPaid] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const customers = data?.customers ?? [];
  const medicines = data?.medicines ?? [];

  const updateRow = (id: number, changes: Partial<Row>) =>
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );

  const pickMedicine = (id: number, medicineId: string) => {
    const medicine = medicines.find((item) => item._id === medicineId);

    updateRow(id, {
      medicine_id: medicineId,
      price: medicine ? String(medicine.price) : "",
    });
  };

  // Subtotal before GST
  const subtotal = rows.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.price) || 0),
    0,
  );

  // GST is fixed
  const gstAmount = subtotal * (FIXED_GST_PERCENTAGE / 100);

  // Total including GST
  const total = subtotal + gstAmount;

  // Amount paid
  const paid = Number(amountPaid) || 0;

  // Remaining amount
  const remaining = Math.max(total - paid, 0);

  const handlePaymentStatusChange = (value: PaymentStatus) => {
    setPaymentStatus(value);

    if (value === "pending") {
      setAmountPaid("0");
    }

    if (value === "confirmed") {
      setAmountPaid(total.toFixed(2));
    }

    if (value === "partial") {
      setAmountPaid("");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    const finalAmountPaid =
      paymentStatus === "pending"
        ? 0
        : paymentStatus === "confirmed"
          ? total
          : Number(amountPaid);

    if (!Number.isFinite(finalAmountPaid) || finalAmountPaid < 0) {
      setError("Please enter a valid amount paid.");
      return;
    }

    if (finalAmountPaid > total) {
      setError("Amount paid cannot be greater than total amount.");
      return;
    }

    if (
      paymentStatus === "partial" &&
      (finalAmountPaid <= 0 || finalAmountPaid >= total)
    ) {
      setError(
        "Partial payment must be greater than 0 and less than the total amount.",
      );
      return;
    }

    const items = [];

    for (const row of rows) {
      const medicine = medicines.find((item) => item._id === row.medicine_id);

      const quantity = Number(row.quantity);
      const price = Number(row.price);

      if (!medicine) {
        setError("Please choose a medicine for every row.");
        return;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        setError(`Quantity for ${medicine.medicine_name} must be 1 or more.`);
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        setError(`Enter a valid price for ${medicine.medicine_name}.`);
        return;
      }

      items.push({
        medicine_id: medicine._id,
        medicine_name: medicine.medicine_name,
        quantity,
        price,
      });
    }

    setSaving(true);

    try {
      // GST is calculated by the backend.
      // Frontend does not send GST percentage.
      const order = await createOrder({
        customer_id: customerId,
        items,
        payment_status: paymentStatus,
        amount_paid: finalAmountPaid,
        notes: notes.trim(),
      });

      onSaved(order);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create order",
      );

      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Order"
      description="Select a customer and add the medicines they ordered."
      onClose={onClose}
      wide
    >
      {loading ? (
        <LoadingBlock label="Loading customers and medicines..." />
      ) : loadError ? (
        <div className="space-y-3">
          <ErrorBanner message={loadError} />

          <button
            type="button"
            onClick={reload}
            className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <ErrorBanner message={error} />}

          <Field label="Customer" required>
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className={inputClass}
            >
              <option value="">Select customer</option>

              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.customer_name} - {customer.store_name}
                </option>
              ))}
            </select>

            {customers.length === 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
                <Info className="h-4 w-4" />

                <span>
                  No customers found.{" "}
                  <Link
                    href="/customers"
                    className="font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    Add a customer
                  </Link>
                </span>
              </div>
            )}
          </Field>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                Medicines
              </h3>

              <button
                type="button"
                onClick={() => setRows((previous) => [...previous, newRow()])}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add medicine
              </button>
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--color-border)] p-3 sm:grid-cols-[minmax(0,1fr)_110px_130px_auto]"
                >
                  <select
                    value={row.medicine_id}
                    onChange={(event) =>
                      pickMedicine(row.id, event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Select medicine</option>

                    {medicines.map((medicine) => (
                      <option key={medicine._id} value={medicine._id}>
                        {medicine.medicine_name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow(row.id, {
                        quantity: event.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="Qty"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(event) =>
                      updateRow(row.id, {
                        price: event.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="Price"
                  />

                  <button
                    type="button"
                    disabled={rows.length === 1}
                    onClick={() =>
                      setRows((previous) =>
                        previous.filter((item) => item.id !== row.id),
                      )
                    }
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-[var(--color-muted)] hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Remove medicine"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Field label="Payment Status">
            <select
              value={paymentStatus}
              onChange={(event) =>
                handlePaymentStatusChange(event.target.value as PaymentStatus)
              }
              className={inputClass}
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          {paymentStatus === "partial" && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-[var(--color-border)] p-4 sm:grid-cols-3">
              <Field label="Total Amount">
                <input
                  type="text"
                  value={formatCurrency(total)}
                  readOnly
                  className={`${inputClass} bg-[var(--color-muted-bg)]`}
                />
              </Field>

              <Field label="Amount Paid" required>
                <input
                  type="number"
                  min="0"
                  max={total}
                  step="0.01"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  className={inputClass}
                  placeholder="Enter amount"
                />
              </Field>

              <Field label="Remaining Amount">
                <input
                  type="text"
                  value={formatCurrency(remaining)}
                  readOnly
                  className={`${inputClass} bg-[var(--color-muted-bg)]`}
                />
              </Field>
            </div>
          )}

          <div className="rounded-xl border border-[var(--color-border)] p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-muted)]">Subtotal</span>

                <span className="font-medium text-[var(--color-text)]">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-muted)]">
                  GST ({FIXED_GST_PERCENTAGE}%)
                </span>

                <span className="font-medium text-[var(--color-text)]">
                  {formatCurrency(gstAmount)}
                </span>
              </div>

              <div className="border-t border-[var(--color-border)] pt-2">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold text-[var(--color-text)]">
                    Total
                  </span>

                  <span className="font-semibold text-[var(--color-text)]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {paymentStatus === "partial" && (
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--color-muted)]">Remaining</span>

                  <span className="font-semibold text-[var(--color-text)]">
                    {formatCurrency(remaining)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={`${inputClass} min-h-24 resize-y`}
              placeholder="Optional notes"
            />
          </Field>

          <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-muted-bg)]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Order
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
