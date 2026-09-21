"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import CustomerFormModal from "@/components/customers/CustomerFormModal";
import {
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
  SuccessBanner,
} from "@/components/ui/Feedback";
import { useFetch } from "@/hooks/useFetch";
import { deleteCustomer, getCustomers } from "@/lib/api";
import type { Customer } from "@/types/customer";

export default function CustomersPanel() {
  const { data, error, loading, reload } = useFetch(getCustomers);

  const [editing, setEditing] = useState<Customer | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const customers = data ?? [];

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const remove = async (customer: Customer) => {
    if (
      !window.confirm(
        `Delete ${customer.store_name}? Their existing orders will stay but show as “Deleted customer”.`,
      )
    )
      return;

    setBusyId(customer._id);
    setActionError(null);

    try {
      await deleteCustomer(customer._id);
      showNotice(`${customer.store_name} was deleted.`);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {notice && <SuccessBanner message={notice} />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {actionError && <ErrorBanner message={actionError} />}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex justify-end border-b border-slate-100 p-4">
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Add Customer
          </button>
        </div>

        {loading && customers.length === 0 ? (
          <LoadingBlock label="Loading customers..." />
        ) : customers.length === 0 ? (
          <EmptyBlock message="No customers yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Store", "Customer", "Mobile", "City", "GST Number", ""].map(
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
                {customers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {customer.store_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer.customer_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer.mobile}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {customer.city}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {customer.gst_number || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Edit ${customer.store_name}`}
                          onClick={() => setEditing(customer)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          aria-label={`Delete ${customer.store_name}`}
                          disabled={busyId === customer._id}
                          onClick={() => remove(customer)}
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

      {(adding || editing) && (
        <CustomerFormModal
          customer={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={(customer) => {
            const wasEditing = Boolean(editing);
            setAdding(false);
            setEditing(null);
            showNotice(
              `${customer.store_name} was ${wasEditing ? "updated" : "added"}.`,
            );
            reload();
          }}
        />
      )}
    </div>
  );
}
