import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useLogout, useTechnicianPresence } from "@/hooks/auth";
import {
  Headphones,
  LayoutDashboard,
  Ticket,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: user } = useUser();
  useTechnicianPresence(user);
  const logout = useLogout();
  const [location, setLocation] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (path: string) => location === path;
  const isTechnician = user?.role === "technician";
  const isAdmin = user?.role === "admin";
  const dashboardLabel = isTechnician ? "Soporte al cliente" : "Dashboard";

  const roleLabel = user?.role === "admin" ? "Admin" : user?.role === "technician" ? "Técnico" : user?.role ?? "";
  const userEmail = user?.username || "";

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const closeMobileNav = () => setMobileNavOpen(false);

  const navLinks = (
    <>
      <Link href="/dashboard">
        <a
          onClick={closeMobileNav}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
            isActive("/dashboard")
              ? "bg-primary/10 text-primary"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          {dashboardLabel}
        </a>
      </Link>
      {(isTechnician || isAdmin) && (
        <Link href="/tickets">
          <a
            onClick={closeMobileNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
              isActive("/tickets")
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Ticket className="w-5 h-5 shrink-0" />
            Tickets
          </a>
        </Link>
      )}
      {!isTechnician && !isAdmin && (
        <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400">
          <Ticket className="w-5 h-5 shrink-0" />
          Tickets
        </span>
      )}
    </>
  );

  return (
    <div className="min-h-screen min-h-dvh flex bg-slate-50">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden touch-manipulation"
          aria-label="Cerrar menú"
          onClick={closeMobileNav}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[min(18rem,88vw)] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-0 lg:min-h-screen transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5 no-underline" onClick={closeMobileNav}>
              <div
                className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#347AFF" }}
              >
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800 truncate text-sm sm:text-base">Andrickson Soporte</span>
            </Link>
            <button
              type="button"
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 touch-manipulation"
              aria-label="Cerrar menú"
              onClick={closeMobileNav}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-3">Menú principal</p>
          <div className="space-y-1">{navLinks}</div>
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 mb-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-full bg-slate-200 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{userEmail || user?.username || "Usuario"}</p>
              <p className="text-xs text-slate-500 truncate">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              closeMobileNav();
              logout.mutate(undefined, {
                onSuccess: () => setLocation("/login"),
              });
            }}
            disabled={logout.isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {logout.isPending ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-screen">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menú"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="min-w-0 truncate font-semibold text-slate-800">Andrickson Soporte</span>
        </header>

        <main className="app-shell-wide flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 lg:p-8 w-full min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
