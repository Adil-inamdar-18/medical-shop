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
import type { Order } from "@/types/order";

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

  const total = rows.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.price) || 0),
    0,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
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
      // Stock is NOT reduced by the backend - the admin updates it manually.
      const order = await createOrder({
        customer_id: customerId,
        items,
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
      {loading && !data ? (
        <LoadingBlock label="Loading customers and medicines..." />
      ) : loadError && !data ? (
        <ErrorBanner message={loadError} onRetry={reload} />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && <ErrorBanner message={error} />}

          <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <Info size={17} className="mt-0.5 shrink-0" />
            Placing an order does not change medicine stock. Stock is updated
            manually by the admin.
          </div>

          <Field label="Customer" required>
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className={inputClass}
            >
              <option value="">
                {customers.length ? "Select a customer" : "No customers found"}
              </option>

              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.store_name} — {customer.customer_name}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Medicines <span className="text-red-500">*</span>
              </span>

              <button
                type="button"
                onClick={() => setRows((previous) => [...previous, newRow()])}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus size={16} />
                Add item
              </button>
            </div>

            {medicines.length === 0 && (
              <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No medicines found. Add some in{" "}
                <Link href="/admin" className="font-semibold underline">
                  Admin Panel → Medicine Inventory
                </Link>{" "}
                first.
              </p>
            )}

            <div className="space-y-3">
              {rows.map((row) => {
                const medicine = medicines.find(
                  (item) => item._id === row.medicine_id,
                );
                const overStock =
                  medicine && Number(row.quantity) > medicine.stock;

                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_90px_110px_auto] sm:items-center">
                      <select
                        value={row.medicine_id}
                        onChange={(event) =>
                          pickMedicine(row.id, event.target.value)
                        }
                        aria-label="Medicine"
                        className={inputClass}
                      >
                        <option value="">Select medicine</option>

                        {medicines.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.medicine_name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={row.quantity}
                        onChange={(event) =>
                          updateRow(row.id, { quantity: event.target.value })
                        }
                        aria-label="Quantity"
                        placeholder="Qty"
                        className={inputClass}
                      />

                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.price}
                        onChange={(event) =>
                          updateRow(row.id, { price: event.target.value })
                        }
                        aria-label="Price"
                        placeholder="Price"
                        className={inputClass}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setRows((previous) =>
                            previous.length > 1
                              ? previous.filter((item) => item.id !== row.id)
                              : previous,
                          )
                        }
                        disabled={rows.length === 1}
                        aria-label="Remove item"
                        className="justify-self-end rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    {medicine && (
                      <p
                        className={`mt-2 text-xs ${overStock ? "text-amber-600" : "text-slate-400"}`}
                      >
                        Current stock: {medicine.stock}
                        {overStock && " — quantity is higher than stock"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Field label="Notes">
            <textarea
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Delivery instructions, urgency, etc."
              className={inputClass}
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Total:{" "}
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(total)}
              </span>
            </p>

            <div className="flex justify-end gap-3">
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
                Create Order
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
