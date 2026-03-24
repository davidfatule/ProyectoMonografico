import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicLayout } from "@/Layouts/PublicLayout";

export default function Home() {
  const [, setLocation] = useLocation();
  const [ticketSearch, setTicketSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketSearch.trim()) {
      setLocation(`/ticket/${ticketSearch.trim()}/status`);
    }
  };

  return (
    <PublicLayout>
      <div
        className="flex-1 flex flex-col justify-center w-full app-shell-wide px-5 sm:px-8 pt-6 pb-20"
        style={{ backgroundColor: "#F5F8FA" }}
      >
        {/* Hero: título, subtítulo, botón + búsqueda */}
        <div className="text-center max-w-2xl mx-auto mb-14 w-full">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl 3xl:text-5xl font-bold text-[#212529] leading-tight mb-4">
            Soporte técnico{" "}
            <span style={{ color: "#347AFF" }}>rápido y confiable</span>
          </h1>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            Estamos aquí para ayudarte. Registra una nueva incidencia o consulta el estado de un ticket existente de forma rápida y sencilla en Andrickson Srl.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto items-stretch">
            <Link href="/new-ticket" className="block">
              <Button
                className="w-full h-12 text-base rounded-xl font-medium text-white border-0 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#347AFF" }}
              >
                Registrar Incidencia
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            <form onSubmit={handleSearch} className="relative flex rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type="text"
                placeholder="Nº de Ticket (ej. TCK-123)"
                className="flex-1 h-12 pl-11 pr-20 rounded-none border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
              />
              <Button
                type="submit"
                variant="secondary"
                className="absolute right-0 top-0 bottom-0 rounded-none border-0 border-l border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium px-4 h-full"
              >
                Buscar
              </Button>
            </form>
          </div>
        </div>

        {/* Tres tarjetas: blanco, sombra suave, iconos en círculo azul/verde */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: "#347AFF" }}
            >
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-bold text-[#212529] mb-2">Garantía Protegida</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Tramitamos tus solicitudes respetando al máximo las políticas de garantía de tus productos.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: "#347AFF" }}
            >
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-bold text-[#212529] mb-2">Respuesta Rápida</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Nuestro equipo de técnicos especializados atiende tu solicitud en el menor tiempo posible.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-bold text-[#212529] mb-2">Seguimiento en Vivo</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Mantente informado sobre cada paso del proceso de reparación con tu número de ticket.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
