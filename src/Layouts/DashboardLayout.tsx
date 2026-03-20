import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/auth";
import { Headphones, LayoutDashboard, Ticket, LogOut, User as UserIcon } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: user } = useUser();
  const logout = useLogout();
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => location === path;
  const isTechnician = user?.role === "technician";
  const isAdmin = user?.role === "admin";
  const dashboardLabel = isTechnician ? "Soporte al cliente" : "Dashboard";

  const roleLabel = user?.role === "admin" ? "Admin" : user?.role === "technician" ? "Técnico" : user?.role ?? "";
  const userEmail = user?.username || "";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-screen">
        {/* Logo */}
        <div className="p-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#347AFF" }}
            >
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800">Andrickson Soporte</span>
          </Link>
        </div>

        {/* Menú principal */}
        <nav className="p-4 flex-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-3">
            Menú principal
          </p>
          <div className="space-y-1">
            <Link href="/dashboard">
              <a
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                {dashboardLabel}
              </a>
            </Link>
            {(isTechnician || isAdmin) && (
              <Link href="/tickets">
                <a
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/tickets")
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Ticket className="w-5 h-5" />
                  Tickets
                </a>
              </Link>
            )}
            {!isTechnician && !isAdmin && (
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400">
                <Ticket className="w-5 h-5" />
                Tickets
              </a>
            )}
          </div>
        </nav>

        {/* Usuario logueado y cerrar sesión */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">
                {userEmail || user?.username || "Usuario"}
              </p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout.mutate(undefined, {
                onSuccess: () => setLocation("/login"),
              });
            }}
            disabled={logout.isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {logout.isPending ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
