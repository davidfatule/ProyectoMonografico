import type { ReactNode } from "react";
import { Link } from "wouter";
import { Headphones } from "lucide-react";
import { clearStoredUser, getStoredUser } from "@/lib/mockAuth";
import { removeTechnicianPresence } from "@/lib/technicianPresence";
import { clearCachedSessionUser } from "@/lib/indexedDb";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const handlePortalClick = () => {
    const u = getStoredUser();
    if (u?.role === "technician") removeTechnicianPresence(u.username);
    clearStoredUser();
    void clearCachedSessionUser();
  };

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-100 pt-[env(safe-area-inset-top,0px)]">
        <div className="app-shell-wide px-5 sm:px-8 flex items-center justify-between min-h-14">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#347AFF" }}
            >
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-base tracking-tight">
              Andrickson Soporte
            </span>
          </Link>
          <Link
            to="/login"
            onClick={handlePortalClick}
            className="text-sm text-slate-500 hover:text-slate-700 no-underline cursor-pointer font-medium py-2 min-h-[44px] inline-flex items-center touch-manipulation"
            aria-label="Ir al portal de empleados"
          >
            Portal Empleados
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="bg-white border-t border-slate-100 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="app-shell-wide px-5 sm:px-8 text-center">
          <p className="text-slate-400 text-sm m-0">
            © {new Date().getFullYear()} Andrickson Soporte. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
