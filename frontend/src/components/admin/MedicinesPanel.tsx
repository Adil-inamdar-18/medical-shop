"use client";

import { useState } from "react";
import {
  Check,
  Info,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import MedicineFormModal from "./MedicineFormModal";
import {
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
  SuccessBanner,
} from "@/components/ui/Feedback";
import { useFetch } from "@/hooks/useFetch";
import {
  createMedicine,
  deleteMedicine,
  getMedicines,
  setMedicineStock,
} from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Medicine } from "@/types/medicine";

const LOW_STOCK_LIMIT = 10;

type MedicinesPanelProps = {
  showAddButton?: boolean;
};

/** Manual stock editor for a single medicine row. */
function StockEditor({
  medicine,
  busy,
  onSave,
}: {
  medicine: Medicine;
  busy: boolean;
  onSave: (stock: number) => void;
}) {
  const [draft, setDraft] = useState(String(medicine.stock));

  const value = Number(draft);
  const valid = draft.trim() !== "" && Number.isInteger(value) && value >= 0;
  const changed = valid && value !== medicine.stock;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Decrease stock"
        onClick={() => setDraft(String(Math.max((valid ? value : 0) - 1, 0)))}
        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
      >
        <Minus size={14} />
      </button>

      <input
        type="number"
        min={0}
        step={1}
        value={draft}
        aria-label={`Stock for ${medicine.medicine_name}`}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && changed) {
            onSave(value);
          }
        }}
        className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-blue-100 ${
          valid ? "border-slate-200 focus:border-blue-500" : "border-red-300"
        }`}
      />

      <button
        type="button"
        aria-label="Increase stock"
        onClick={() => setDraft(String((valid ? value : 0) + 1))}
        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
      >
        <Plus size={14} />
      </button>

      {changed && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onSave(value)}
          className="ml-1 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Check size={13} />
          )}
          Save
        </button>
      )}
    </div>
  );
}

export default function MedicinesPanel({
  showAddButton = false,
}: MedicinesPanelProps) {
  const { data, error, loading, reload } = useFetch(getMedicines);

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Medicine | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);

  const [newMedicine, setNewMedicine] = useState({
    medicine_name: "",
    price: "",
    stock: "",
    manufacturer: "",
    category: "",
    expiry_date: "",
    description: "",
  });

  const medicines = data ?? [];
  const query = search.trim().toLowerCase();

  const filtered = query
    ? medicines.filter((medicine) =>
        [medicine.medicine_name, medicine.manufacturer, medicine.category]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query)),
      )
    : medicines;

  const outOfStock = medicines.filter((m) => m.stock === 0).length;

  const lowStock = medicines.filter(
    (m) => m.stock > 0 && m.stock <= LOW_STOCK_LIMIT,
  ).length;

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const saveStock = async (medicine: Medicine, stock: number) => {
    setBusyId(medicine._id);
    setActionError(null);

    try {
      await setMedicineStock(medicine._id, stock);

      showNotice(`${medicine.medicine_name} stock updated to ${stock}.`);

      reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update stock",
      );
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (medicine: Medicine) => {
    if (
      !window.confirm(
        `Delete ${medicine.medicine_name}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusyId(medicine._id);
    setActionError(null);

    try {
      await deleteMedicine(medicine._id);

      showNotice(`${medicine.medicine_name} was deleted.`);

      reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete medicine",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateMedicine = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setCreating(true);
    setActionError(null);

    try {
      const price = Number(newMedicine.price);
      const stock = Number(newMedicine.stock);

      if (!newMedicine.medicine_name.trim()) {
        throw new Error("Medicine name is required");
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Enter a valid price");
      }

      if (!Number.isInteger(stock) || stock < 0) {
        throw new Error("Stock must be a whole number of 0 or more");
      }

      await createMedicine({
        medicine_name: newMedicine.medicine_name.trim(),
        price,
        stock,
        manufacturer: newMedicine.manufacturer.trim(),
        category: newMedicine.category.trim(),
        expiry_date: newMedicine.expiry_date || undefined,
        description: newMedicine.description.trim(),
      });

      setShowAddModal(false);

      setNewMedicine({
        medicine_name: "",
        price: "",
        stock: "",
        manufacturer: "",
        category: "",
        expiry_date: "",
        description: "",
      });

      showNotice("Medicine created successfully.");

      reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to create medicine",
      );
    } finally {
      setCreating(false);
    }
  };

  const updateNewMedicine = (
    field: keyof typeof newMedicine,
    value: string,
  ) => {
    setNewMedicine((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info size={17} className="mt-0.5 shrink-0" />

        <span>
          Stock is managed manually. Placing or changing an order never reduces
          these quantities — update them here when needed.
        </span>
      </div>

      {notice && <SuccessBanner message={notice} />}

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {actionError && <ErrorBanner message={actionError} />}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Search size={18} className="text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search medicines..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(lowStock > 0 || outOfStock > 0) && (
              <span className="text-xs text-slate-500">
                {outOfStock > 0 && (
                  <span className="font-medium text-red-600">
                    {outOfStock} out of stock
                  </span>
                )}

                {outOfStock > 0 && lowStock > 0 && " · "}

                {lowStock > 0 && (
                  <span className="font-medium text-amber-600">
                    {lowStock} low
                  </span>
                )}
              </span>
            )}

            {showAddButton && (
              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Medicine
              </button>
            )}
          </div>
        </div>

        {loading && medicines.length === 0 ? (
          <LoadingBlock label="Loading medicines..." />
        ) : filtered.length === 0 ? (
          <EmptyBlock
            message={
              medicines.length === 0
                ? "No medicines yet."
                : "No medicines match your search."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Medicine", "Price", "Stock (manual)", "Expiry", ""].map(
                    (heading, index) => (
                      <th
                        key={index}
                        className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {filtered.map((medicine) => (
                  <tr
                    key={medicine._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">
                        {medicine.medicine_name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {[medicine.manufacturer, medicine.category]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {formatCurrency(medicine.price)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <StockEditor
                          key={`${medicine._id}-${medicine.stock}`}
                          medicine={medicine}
                          busy={busyId === medicine._id}
                          onSave={(stock) => saveStock(medicine, stock)}
                        />

                        {medicine.stock === 0 ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            Out of stock
                          </span>
                        ) : medicine.stock <= LOW_STOCK_LIMIT ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Low
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(medicine.expiry_date)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${medicine.medicine_name}`}
                          onClick={() => setEditing(medicine)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${medicine.medicine_name}`}
                          disabled={busyId === medicine._id}
                          onClick={() => remove(medicine)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <MedicineFormModal
          medicine={editing}
          onClose={() => setEditing(null)}
          onSaved={(medicine) => {
            setEditing(null);

            showNotice(`${medicine.medicine_name} was updated.`);

            reload();
          }}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Add Medicine
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new medicine to your inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Medicine Name *
                  </label>

                  <input
                    required
                    value={newMedicine.medicine_name}
                    onChange={(event) =>
                      updateNewMedicine("medicine_name", event.target.value)
                    }
                    placeholder="Enter medicine name"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Price *
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMedicine.price}
                    onChange={(event) =>
                      updateNewMedicine("price", event.target.value)
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Stock *
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={newMedicine.stock}
                    onChange={(event) =>
                      updateNewMedicine("stock", event.target.value)
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Manufacturer
                  </label>

                  <input
                    value={newMedicine.manufacturer}
                    onChange={(event) =>
                      updateNewMedicine("manufacturer", event.target.value)
                    }
                    placeholder="Manufacturer"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Category
                  </label>

                  <input
                    value={newMedicine.category}
                    onChange={(event) =>
                      updateNewMedicine("category", event.target.value)
                    }
                    placeholder="Category"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Expiry Date
                  </label>

                  <input
                    type="date"
                    value={newMedicine.expiry_date}
                    onChange={(event) =>
                      updateNewMedicine("expiry_date", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={newMedicine.description}
                    onChange={(event) =>
                      updateNewMedicine("description", event.target.value)
                    }
                    placeholder="Medicine description"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}

                  {creating ? "Adding..." : "Add Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
