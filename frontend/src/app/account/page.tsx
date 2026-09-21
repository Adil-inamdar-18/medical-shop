"use client";

import { useState } from "react";
import { MapPin, Search, Store } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
} from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { getCustomers } from "@/lib/api";

export default function CustomerPage() {
  const { user, loading: authLoading } = useAuth();
  const { data, error, loading, reload } = useFetch(getCustomers);
  const [search, setSearch] = useState("");

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <LoadingBlock label="Loading..." />
      </DashboardLayout>
    );
  }

  const stores = data ?? [];
  const query = search.trim().toLowerCase();

  const filtered = query
    ? stores.filter((store) =>
        [store.store_name, store.city, store.address]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query)),
      )
    : stores;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer</h1>
          <p className="mt-1 text-sm text-slate-500">
            Available stores you can place orders for.
          </p>
        </div>

        {error && <ErrorBanner message={error} onRetry={reload} />}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <div className="flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stores..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {loading && stores.length === 0 ? (
            <LoadingBlock label="Loading stores..." />
          ) : filtered.length === 0 ? (
            <EmptyBlock
              message={
                stores.length === 0
                  ? "No stores available yet."
                  : "No stores match your search."
              }
            />
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((store) => (
                <div
                  key={store._id}
                  className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Store size={20} />
                    </div>

                    <h2 className="truncate font-semibold text-slate-800">
                      {store.store_name}
                    </h2>
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={15} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p>{store.city}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {store.address}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
