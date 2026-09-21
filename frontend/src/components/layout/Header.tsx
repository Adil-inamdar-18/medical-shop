"use client";

import { useState } from "react";
import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6 lg:px-8">
      <button
        onClick={onMenuClick}
        className="mr-4 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="hidden md:block">
        <h2 className="text-lg font-semibold text-slate-900">
          Medical Dashboard
        </h2>

        <p className="text-xs text-slate-500">
          Manage your medical business
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search size={17} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search..."
            className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name ?? "..."}
              </p>

              <p className="text-[11px] capitalize text-slate-400">
                {user?.role ?? ""}
              </p>
            </div>

            <ChevronDown
              size={16}
              className="hidden text-slate-400 sm:block"
            />
          </button>

          {menuOpen && (
            <>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-30 cursor-default"
              />

              <div className="absolute right-0 z-40 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <p className="truncate px-3 py-2 text-xs text-slate-400">
                  {user?.email}
                </p>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}