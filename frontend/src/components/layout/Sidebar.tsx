"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Pill,
  ClipboardList,
  UserCircle,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    name: "Medicine",
    href: "/medicine",
    icon: Pill,
    adminOnly: false,
  },
  {
    name: "Order",
    href: "/orders",
    icon: ClipboardList,
    adminOnly: false,
  },
  {
    // Full customer directory - admin only. Regular users manage their own
    // details from "Customer" instead (see below).
    name: "Customers",
    href: "/customers",
    icon: Users,
    adminOnly: true,
  },
  {
    // A regular user's own profile - not shown to admins, who don't have a
    // customer profile of their own.
    name: "Customer",
    href: "/account",
    icon: UserCircle,
    adminOnly: false,
    hideForAdmin: true,
  },
  {
    name: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = navigation.filter((item) => {
    if (item.adminOnly && user?.role !== "admin") return false;
    if (item.hideForAdmin && user?.role === "admin") return false;
    return true;
  });

  return (
    <>
      {open && (
        <button
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <Link href="/" onClick={onClose} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Activity size={22} />
            </div>

            <div>
              <h1 className="text-base font-bold text-slate-900">
                Medical App
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                Management System
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Medical Management
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Manage customers, orders and business operations.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}