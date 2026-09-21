"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, ShieldCheck, Users, Database } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import MedicinesPanel from "@/components/admin/MedicinesPanel";
import OrdersPanel from "@/components/admin/OrdersPanel";
import CustomersPanel from "@/components/admin/CustomersPanel";
import { LoadingBlock } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { getHealth } from "@/lib/api";

const settings = [
  {
    title: "User Management",
    description: "Manage administrators and application users.",
    icon: Users,
  },
  {
    title: "Security",
    description: "Configure authentication and security settings.",
    icon: ShieldCheck,
  },
  {
    title: "System Settings",
    description: "Manage application configuration.",
    icon: Settings,
  },
  {
    title: "Database",
    description: "Monitor application data and database status.",
    icon: Database,
  },
];

const tabs = [
  { id: "medicines", label: "Medicine Inventory" },
  { id: "orders", label: "Orders" },
  { id: "customers", label: "Customers" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Server-side route protection already lives in middleware.ts; this is a
  // client-side fallback so a non-admin never sees admin data render.
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/orders");
    }
  }, [authLoading, user, router]);

  const [tab, setTab] = useState<TabId>("medicines");
  const { data: health, error: healthError, loading: healthLoading } =
    useFetch(getHealth);

  if (authLoading || (user && user.role !== "admin")) {
    return (
      <DashboardLayout>
        <LoadingBlock label="Loading..." />
      </DashboardLayout>
    );
  }

  const dbStatus = healthLoading && !health
    ? { label: "Checking...", className: "bg-slate-100 text-slate-500" }
    : healthError || !health
      ? { label: "Server offline", className: "bg-red-50 text-red-700" }
      : health.database === "connected"
        ? { label: "Database connected", className: "bg-emerald-50 text-emerald-700" }
        : { label: `Database ${health.database}`, className: "bg-amber-50 text-amber-700" };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage application settings and administration.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {settings.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={21} />
                  </div>

                  {item.title === "Database" && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${dbStatus.className}`}
                    >
                      {dbStatus.label}
                    </span>
                  )}
                </div>

                <h2 className="mt-5 font-semibold text-slate-900">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Management sections */}
        <div>
          <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  tab === item.id
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "medicines" && <MedicinesPanel />}
          {tab === "orders" && <OrdersPanel />}
          {tab === "customers" && <CustomersPanel />}
        </div>
      </div>
    </DashboardLayout>
  );
}
