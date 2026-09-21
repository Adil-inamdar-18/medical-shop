"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Phone, MapPin } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerFormModal from "@/components/customers/CustomerFormModal";
import {
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
  SuccessBanner,
} from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { getCustomers } from "@/lib/api";

export default function CustomersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Server-side route protection already lives in middleware.ts; this is a
  // client-side fallback so a non-admin never sees the full customer
  // directory render. Regular users have their own account page instead.
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/account");
    }
  }, [authLoading, user, router]);

  const { data, error, loading, reload } = useFetch(getCustomers);

  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (authLoading || (user && user.role !== "admin")) {
    return (
      <DashboardLayout>
        <LoadingBlock label="Loading..." />
      </DashboardLayout>
    );
  }

  const customers = data ?? [];
  const query = search.trim().toLowerCase();

  const filtered = query
    ? customers.filter((customer) =>
        [
          customer.store_name,
          customer.customer_name,
          customer.mobile,
          customer.city,
          customer.gst_number,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query)),
      )
    : customers;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your medical store customers.
            </p>
          </div>

          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>

        {notice && <SuccessBanner message={notice} />}
        {error && <ErrorBanner message={error} onRetry={reload} />}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <div className="flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {loading && customers.length === 0 ? (
            <LoadingBlock label="Loading customers..." />
          ) : filtered.length === 0 ? (
            <EmptyBlock
              message={
                customers.length === 0
                  ? "No customers yet. Click “Add Customer” to create one."
                  : "No customers match your search."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Store", "Customer", "Contact", "Location", "GST Number"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((customer) => (
                    <tr
                      key={customer._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {customer.store_name}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {customer.customer_name}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={15} />
                          {customer.mobile}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin size={15} />
                          {customer.city}
                        </div>

                        <p className="ml-[23px] mt-0.5 text-xs text-slate-400">
                          {customer.address}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {customer.gst_number || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {adding && (
        <CustomerFormModal
          onClose={() => setAdding(false)}
          onSaved={(customer) => {
            setAdding(false);
            setNotice(`${customer.store_name} was added as a customer.`);
            window.setTimeout(() => setNotice(null), 5000);
            reload();
          }}
        />
      )}
    </DashboardLayout>
  );
}
