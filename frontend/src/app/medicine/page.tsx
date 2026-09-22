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
import {
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
} from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { getMedicines } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";

const LOW_STOCK_LIMIT = 10;

export default function MedicinePage() {
  const { user } = useAuth();

  const {
    data,
    error,
    loading,
    reload,
  } = useFetch(getMedicines);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const medicines = data ?? [];

  /* -----------------------------------------
     Categories
  ----------------------------------------- */

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        medicines
          .map((medicine) => medicine.category)
          .filter(
            (category): category is string =>
              Boolean(category),
          ),
      ),
    );

    return ["All", ...uniqueCategories];
  }, [medicines]);

  /* -----------------------------------------
     Search + Category Filter
  ----------------------------------------- */

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return medicines.filter((medicine) => {
      const matchesCategory =
        category === "All" ||
        medicine.category === category;

      if (!query) {
        return matchesCategory;
      }

      const matchesQuery = [
        medicine.medicine_name,
        medicine.manufacturer,
        medicine.category,
      ]
        .filter(
          (value): value is string =>
            Boolean(value),
        )
        .some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesCategory && matchesQuery;
    });
  }, [medicines, search, category]);

  /* -----------------------------------------
     Render
  ----------------------------------------- */

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1200px] space-y-5">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Medicine
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Browse available medicines, pricing and stock.
            </p>
          </div>

          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Orders
          </Link>
        </div>

        {/* Admin Info */}
        {user?.role === "admin" && (
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <Info
              size={17}
              className="mt-0.5 shrink-0"
            />

            <p>
              This is a read-only catalog view. Add, edit or
              update stock from{" "}
              <Link
                href="/admin"
                className="font-semibold underline"
              >
                Admin Panel → Medicine Inventory
              </Link>
              .
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={reload}
          />
        )}

        {/* Search */}
        <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
          <Search
            size={19}
            className="shrink-0 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
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
                type="button"
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
                  : `${filtered.length} formulation${
                      filtered.length === 1
                        ? ""
                        : "s"
                    } listed`}
              </p>

              <p className="text-xs text-slate-500">
                Live catalog from your inventory
              </p>
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
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] border-collapse">

                {/* Table Header */}
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Medicine
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Manufacturer
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Category
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Price
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stock
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Expiry
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Details
                    </th>

                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>

                  {filtered.map((medicine) => {
                    const isOpen =
                      expanded === medicine._id;

                    return (
                      <MedicineTableRows
                        key={medicine._id}
                        medicine={medicine}
                        isOpen={isOpen}
                        onToggle={() =>
                          setExpanded(
                            isOpen
                              ? null
                              : medicine._id,
                          )
                        }
                      />
                    );
                  })}

                </tbody>

              </table>

            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

          <ShieldCheck
            size={22}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <p className="text-sm font-medium text-slate-900">
              Formulary sourced live
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Prices and stock levels shown here are
              pulled directly from the current inventory.
            </p>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

/* =====================================================
   MEDICINE TABLE ROWS
===================================================== */

function MedicineTableRows({
  medicine,
  isOpen,
  onToggle,
}: {
  medicine: any;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {/* Main Row */}
      <tr className="border-b border-slate-100 transition hover:bg-slate-50">

        {/* Medicine */}
        <td className="px-5 py-4">
          <div>
            <p className="font-medium text-slate-900">
              {medicine.medicine_name}
            </p>

            {!medicine.description && (
              <p className="mt-1 text-xs text-slate-400">
                No description available
              </p>
            )}
          </div>
        </td>

        {/* Manufacturer */}
        <td className="px-5 py-4 text-sm text-slate-600">
          {medicine.manufacturer ||
            "Manufacturer not specified"}
        </td>

        {/* Category */}
        <td className="px-5 py-4">
          <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {medicine.category ||
              "Uncategorized"}
          </span>
        </td>

        {/* Price */}
        <td className="px-5 py-4 text-sm font-semibold text-blue-700">
          {formatCurrency(medicine.price)}
        </td>

        {/* Stock */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">

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

            <span className="text-sm text-slate-600">
              {medicine.stock}
            </span>

          </div>
        </td>

        {/* Expiry */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">

            <CalendarDays
              size={15}
              className="text-slate-400"
            />

            {medicine.expiry_date
              ? formatDate(medicine.expiry_date)
              : "—"}

          </div>
        </td>

        {/* Details */}
        <td className="px-5 py-4">

          {medicine.description ? (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
            >

              <Info size={14} />

              Details

              <ChevronDown
                size={14}
                className={`transition-transform ${
                  isOpen
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>
          ) : (
            <span className="text-xs text-slate-400">
              —
            </span>
          )}

        </td>

      </tr>

      {/* Expanded Description */}
      {isOpen && medicine.description && (
        <tr className="border-b border-slate-100 bg-slate-50">
          <td
            colSpan={7}
            className="px-5 py-4"
          >
            <div className="flex items-start gap-3">

              <Info
                size={17}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Medicine Details
                </p>

                <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
                  {medicine.description}
                </p>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}