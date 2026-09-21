"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Info,
  Pill,
  Search,
  ShieldCheck,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { EmptyBlock, ErrorBanner, LoadingBlock } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { getMedicines } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";

const LOW_STOCK_LIMIT = 10;

export default function MedicinePage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useFetch(getMedicines);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const medicines = useMemo(() => data ?? [], [data]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(medicines.map((medicine) => medicine.category).filter(Boolean)),
    ) as string[];

    return ["All", ...unique];
  }, [medicines]);

  const query = search.trim().toLowerCase();

  const filtered = medicines.filter((medicine) => {
    const matchesCategory = category === "All" || medicine.category === category;

    const matchesQuery = query
      ? [medicine.medicine_name, medicine.manufacturer, medicine.category]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))
      : true;

    return matchesCategory && matchesQuery;
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1050px] space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Medicine</h1>

            <p className="mt-1 text-sm text-slate-500">
              Browse available medicines, pricing and stock.
            </p>
          </div>

          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Orders
          </Link>
        </div>

        {user?.role === "admin" && (
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <Info size={17} className="mt-0.5 shrink-0" />
            This is a read-only catalog view. Add, edit or update stock from{" "}
            <Link href="/admin" className="font-semibold underline">
              Admin Panel → Medicine Inventory
            </Link>
            .
          </div>
        )}

        {error && <ErrorBanner message={error} onRetry={reload} />}

        {/* Search */}
        <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
          <Search size={19} className="text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search medicines, manufacturer, category..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Categories */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === item
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
              <Pill size={20} />
            </div>

            <div>
              <p className="font-medium text-slate-900">
                {loading && medicines.length === 0
                  ? "Loading..."
                  : `${filtered.length} formulation${filtered.length === 1 ? "" : "s"} listed`}
              </p>

              <p className="text-xs text-slate-500">Live catalog from your inventory</p>
            </div>
          </div>
        </div>

        {/* Medicines */}
        {loading && medicines.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <LoadingBlock label="Loading medicines..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyBlock
              message={
                medicines.length === 0
                  ? "No medicines available yet."
                  : "No medicines match your search."
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((medicine) => {
              const isOpen = expanded === medicine._id;

              return (
                <article
                  key={medicine._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                      {medicine.category || "Uncategorized"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">
                        {medicine.medicine_name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {medicine.manufacturer || "Manufacturer not specified"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold text-blue-700">
                        {formatCurrency(medicine.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {medicine.stock === 0 ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          Out of stock
                        </span>
                      ) : medicine.stock <= LOW_STOCK_LIMIT ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Low stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          In stock
                        </span>
                      )}

                      <span>{medicine.stock} units</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays size={15} />
                      Exp: {formatDate(medicine.expiry_date)}
                    </div>
                  </div>

                  {medicine.description && (
                    <>
                      <button
                        onClick={() => setExpanded(isOpen ? null : medicine._id)}
                        className="mt-3 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-700"
                      >
                        <span className="flex items-center gap-2">
                          <Info size={16} className="text-blue-600" />
                          Details
                        </span>

                        <ChevronDown
                          size={17}
                          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isOpen && (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {medicine.description}
                        </p>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-blue-600" />

          <div>
            <p className="text-sm font-medium text-slate-900">Formulary sourced live</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Prices and stock levels shown here are pulled directly from the
              current inventory.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
