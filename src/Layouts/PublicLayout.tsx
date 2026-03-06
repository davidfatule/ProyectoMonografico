import type { ReactNode } from "react";
import { Link } from "wouter";
import { Headphones } from "lucide-react";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#347AFF" }}
            >
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-base tracking-tight">
              SoportePro
            </span>
          </Link>
          <Link
            to="/login"
            className="text-sm text-slate-500 hover:text-slate-700 no-underline cursor-pointer font-medium"
            aria-label="Ir al portal de empleados"
          >
            Portal Empleados
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="bg-white border-t border-slate-100 py-5">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-slate-400 text-sm m-0">
            © {new Date().getFullYear()} SoportePro. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
