"use client";

import { useState } from "react";
import { AlertTriangle, Building2, Link2, Plus, Search } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import CreateOrderModal from "@/components/orders/CreateOrderModal";
import {
  ErrorBanner,
  LoadingBlock,
  SuccessBanner,
} from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { getOrders } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  getOrderCustomer,
  orderStatusStyles,
} from "@/lib/format";
import type { Order, OrderStatus } from "@/types/order";

const FILTERS: Array<"all" | OrderStatus> = ["all", "pending", "confirmed", "partial"];

const filterLabel: Record<"all" | OrderStatus, string> = {
  all: "All Orders",
  pending: "Pending",
  confirmed: "Confirmed",
  partial: "Partial",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useFetch(getOrders);

  
  const canCreateOrder = user?.role !== "admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const orders = data ?? [];
  const query = search.trim().toLowerCase();

  const filtered = orders.filter((order) => {
    const matchesFilter = statusFilter === "all" || order.status === statusFilter;

    const customer = getOrderCustomer(order);

    const matchesQuery = query
      ? [
          order.order_number,
          customer?.store_name,
          customer?.customer_name,
          ...order.items.map((item) => item.medicine_name),
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))
      : true;

    return matchesFilter && matchesQuery;
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Orders</h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and track customer orders.
            </p>
          </div>

          {canCreateOrder && (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Create Order
            </button>
          )}
        </div>

        {notice && <SuccessBanner message={notice} />}
        {error && <ErrorBanner message={error} onRetry={reload} />}

        {/* Search */}
        <div className="flex h-[52px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
          <Search size={20} className="shrink-0 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search orders by number, medicine, customer..."
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => {
            const isActive = statusFilter === filter;
            const count =
              filter === "all"
                ? orders.length
                : orders.filter((order) => order.status === filter).length;

            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {filterLabel[filter]}

                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
                    isActive ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders */}
        {loading && orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <LoadingBlock label="Loading orders..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-medium text-slate-800">
              {orders.length === 0 ? "No orders yet" : "No orders found"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {orders.length === 0
                ? canCreateOrder
                  ? "Click “Create Order” to add one."
                  : "No orders have been placed yet."
                : "Try changing your search or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>

      {creating && canCreateOrder && (
        <CreateOrderModal
          onClose={() => setCreating(false)}
          onSaved={(order) => {
            setCreating(false);
            setNotice(`Order ${order.order_number} was created.`);
            window.setTimeout(() => setNotice(null), 5000);
            reload();
          }}
        />
      )}
    </DashboardLayout>
  );
}

/* -------------------------------- */
/* Order Card */
/* -------------------------------- */

function OrderCard({ order }: { order: Order }) {
  const customer = getOrderCustomer(order);
  const firstItem = order.items[0];
  const medicineNames = order.items.map((item) => item.medicine_name).join(", ");

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
        order.status === "pending" ? "border-amber-200" : "border-slate-200"
      }`}
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {order.order_number}
            </h2>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${orderStatusStyles[order.status]}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {order.status}
            </span>
          </div>

          <p className="mt-1 text-[13px] text-slate-400">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-lg font-semibold text-slate-900">
            {formatCurrency(order.total_amount)}
          </div>
        </div>
      </div>

      {/* Customer */}
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-slate-900">
            {customer?.store_name ?? "Deleted customer"}
          </div>

          <div className="mt-0.5 truncate text-xs text-slate-500">
            {customer?.customer_name}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-4">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
          <Link2 size={16} />
          {order.items.length} item{order.items.length === 1 ? "" : "s"}
          {firstItem && (
            <span className="font-normal text-slate-400">
              {" "}
              · {firstItem.medicine_name} × {firstItem.quantity}
              {order.items.length > 1 && ` +${order.items.length - 1} more`}
            </span>
          )}
        </div>

        <p className="mt-1.5 truncate pl-6 text-[13px] text-slate-500">
          {medicineNames}
        </p>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-[12px] text-amber-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{order.notes}</span>
        </div>
      )}
    </article>
  );
}
