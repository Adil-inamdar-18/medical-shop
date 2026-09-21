"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShoppingCart,
  IndianRupee,
  Clock3,
  ArrowUpRight,
  Plus,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import RecentOrders from "@/components/dashboard/RecentOrders";
import CustomerFormModal from "@/components/customers/CustomerFormModal";
import {
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
  SuccessBanner,
} from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { loadDashboard } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/format";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Server-side route protection already lives in middleware.ts; this is a
  // client-side fallback so a non-admin never sees dashboard data render.
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/orders");
    }
  }, [authLoading, user, router]);

  const { data, error, loading, reload } = useFetch(loadDashboard);

  const [addingCustomer, setAddingCustomer] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [range, setRange] = useState<6 | 12>(6);

  if (authLoading || (user && user.role !== "admin")) {
    return (
      <DashboardLayout>
        <LoadingBlock label="Loading..." />
      </DashboardLayout>
    );
  }

  const customers = data?.customers ?? [];
  const orders = data?.orders ?? [];
  const stats = data?.stats;

  const sales = data?.sales[range] ?? [];
  const maxSale = Math.max(...sales.map((month) => month.total), 1);

  const statusRows = [
    { label: "Confirmed orders", status: "confirmed", bar: "bg-emerald-500" },
    { label: "Partial orders", status: "partial", bar: "bg-blue-500" },
    { label: "Pending orders", status: "pending", bar: "bg-amber-500" },
  ].map((row) => {
    const count = orders.filter((order) => order.status === row.status).length;

    return {
      ...row,
      count,
      percent: orders.length ? Math.round((count / orders.length) * 100) : 0,
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Overview</p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setAddingCustomer(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Add Customer
            </button>

            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              View Reports
              <ArrowUpRight size={17} />
            </button>
          </div>
        </div>

        {notice && <SuccessBanner message={notice} />}
        {error && <ErrorBanner message={error} onRetry={reload} />}

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Customers"
            value={stats ? stats.totalCustomers.toLocaleString() : "—"}
            description={
              stats ? `${stats.newCustomersThisMonth} added this month` : "Loading..."
            }
            icon={Users}
            iconClassName="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Total Orders"
            value={stats ? stats.totalOrders.toLocaleString() : "—"}
            description={
              stats ? `${stats.ordersThisMonth} placed this month` : "Loading..."
            }
            icon={ShoppingCart}
            iconClassName="bg-violet-50 text-violet-600"
          />

          <StatCard
            title="Total Sales"
            value={stats ? formatCurrency(stats.totalSales) : "—"}
            description={
              stats
                ? `${formatCurrency(stats.salesThisMonth)} this month`
                : "Loading..."
            }
            icon={IndianRupee}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Pending Orders"
            value={stats ? stats.pendingOrders.toString() : "—"}
            description={
              stats && stats.pendingOrders === 0
                ? "All caught up"
                : "Requires attention"
            }
            icon={Clock3}
            iconClassName="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Main content */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <RecentOrders orders={orders} loading={loading} />

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-semibold text-slate-900">Top Customers</h2>

              <p className="mt-1 text-sm text-slate-500">
                Your most recent customers
              </p>
            </div>

            {loading && customers.length === 0 ? (
              <LoadingBlock label="Loading customers..." />
            ) : customers.length === 0 ? (
              <EmptyBlock message="No customers yet. Add your first one." />
            ) : (
              <div className="divide-y divide-slate-100">
                {customers.slice(0, 5).map((customer, index) => (
                  <div
                    key={customer._id}
                    className="flex items-center gap-3 px-6 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                      {customer.store_name.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {customer.store_name}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {customer.customer_name}
                      </p>
                    </div>

                    <span className="text-xs font-medium text-slate-400">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 p-4">
              <a
                href="/customers"
                className="block rounded-xl bg-slate-50 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                View all customers
              </a>
            </div>
          </div>
        </div>

        {/* Business overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Sales Overview</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Monthly sales performance
                </p>
              </div>

              <select
                value={range}
                onChange={(event) =>
                  setRange(Number(event.target.value) as 6 | 12)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none"
              >
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </select>
            </div>

            <div className="mt-8 flex h-64 items-end gap-3 border-b border-l border-slate-100 px-4 pb-0 pt-6">
              {sales.map((month, index) => (
                <div
                  key={`${month.label}-${index}`}
                  title={`${month.label}: ${formatCurrency(month.total)}`}
                  className="group flex h-full flex-1 items-end"
                >
                  <div
                    style={{
                      height: `${month.total ? Math.max((month.total / maxSale) * 100, 3) : 1}%`,
                    }}
                    className="w-full rounded-t-lg bg-blue-100 transition-all duration-200 group-hover:bg-blue-600"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-3 px-4 text-center text-xs text-slate-400">
              {sales.map((month, index) => (
                <span key={`${month.label}-${index}`} className="flex-1">
                  {month.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Quick Summary</h2>

            <p className="mt-1 text-sm text-slate-500">
              Current business activity
            </p>

            <div className="mt-6 space-y-5">
              {statusRows.map((row) => (
                <div key={row.status}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-500">
                      {row.label}
                      <span className="text-slate-400"> ({row.count})</span>
                    </span>

                    <span className="font-semibold text-slate-800">
                      {row.percent}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      style={{ width: `${row.percent}%` }}
                      className={`h-2 rounded-full ${row.bar}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {addingCustomer && (
        <CustomerFormModal
          onClose={() => setAddingCustomer(false)}
          onSaved={(customer) => {
            setAddingCustomer(false);
            setNotice(`${customer.store_name} was added as a customer.`);
            window.setTimeout(() => setNotice(null), 5000);
            reload();
          }}
        />
      )}
    </DashboardLayout>
  );
}
