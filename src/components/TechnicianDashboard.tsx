import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTickets, useUpdateTicketStatus, useSyncTicketsNow } from "@/hooks/tickets";
import { useUser } from "@/hooks/auth";
import { assigneeMatchesSession } from "@/lib/mockAuth";
import { Loader2, MoreVertical, Briefcase, Clock, Wrench, CheckCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClientTypeCell } from "@/components/ClientTypeCell";

type TicketRow = {
  id: number;
  ticket_number: string;
  status: string;
  product?: string | null;
  description?: string | null;
  created_at: string;
  assignee_username?: string | null;
  client_type?: string | null;
  rnc?: string | null;
};

const STATUS_OPTIONS = [
  { value: "En Proceso", label: "Iniciar Proceso" },
  { value: "Resuelto", label: "Resolver Ticket" },
  { value: "Descartado", label: "Ticket Descartado" },
];
const STATUSES_REQUIRING_COMMENT = new Set(["Resuelto", "Descartado"]);
type PendingCommentAction = { ticketNumber: string; status: string } | null;

function clampDropdownLeft(triggerRight: number, menuWidthPx: number): number {
  const margin = 8;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const preferred = triggerRight - menuWidthPx;
  return Math.min(Math.max(margin, preferred), vw - menuWidthPx - margin);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pendiente: "bg-amber-100 text-amber-800",
    "En Proceso": "bg-blue-100 text-blue-800",
    Resuelto: "bg-emerald-100 text-emerald-800",
    Rechazado: "bg-red-100 text-red-800",
    Descartado: "bg-slate-200 text-slate-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export function TechnicianDashboard() {
  const { data: tickets, isLoading, error } = useTickets();
  const { data: user } = useUser();
  const updateStatus = useUpdateTicketStatus();
  const syncNow = useSyncTicketsNow();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [pendingCommentAction, setPendingCommentAction] = useState<PendingCommentAction>(null);
  const [supportComment, setSupportComment] = useState("");
  const [supportCommentError, setSupportCommentError] = useState("");

  const allTickets = (tickets || []) as TicketRow[];
  const list = allTickets.filter((t) => {
    if (!user?.username) return true;
    if (!t.assignee_username?.trim()) return true;
    return assigneeMatchesSession(t.assignee_username, user.username);
  });
  const total = list.length;
  const pendientes = list.filter((t) => t.status === "Pendiente").length;
  const enProceso = list.filter((t) => t.status === "En Proceso").length;
  const resueltos = list.filter((t) => t.status === "Resuelto").length;

  const handleOpenMenu = (e: React.MouseEvent, ticketNumber: string) => {
    e.stopPropagation();
    if (openMenu === ticketNumber) {
      setOpenMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuW = 192; /* w-48 */
    setMenuPosition({ top: rect.bottom + 4, left: clampDropdownLeft(rect.right, menuW) });
    setOpenMenu(ticketNumber);
  };

  useEffect(() => {
    const close = () => setOpenMenu(null);
    if (openMenu) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [openMenu]);

  const handleStatusChange = (ticketNumber: string, status: string) => {
    setOpenMenu(null);
    if (STATUSES_REQUIRING_COMMENT.has(status)) {
      setSupportComment("");
      setSupportCommentError("");
      setPendingCommentAction({ ticketNumber, status });
      return;
    }

    updateStatus.mutate({ ticketNumber, status });
  };

  const closeCommentDialog = () => {
    if (updateStatus.isPending) return;
    setPendingCommentAction(null);
    setSupportComment("");
    setSupportCommentError("");
  };

  const submitCommentAndUpdate = () => {
    if (!pendingCommentAction) return;
    const trimmed = supportComment.trim();
    if (!trimmed) {
      setSupportCommentError("Debes escribir un comentario para continuar.");
      return;
    }

    updateStatus.mutate(
      {
        ticketNumber: pendingCommentAction.ticketNumber,
        status: pendingCommentAction.status,
        comment: trimmed,
      },
      {
        onSuccess: () => {
          setPendingCommentAction(null);
          setSupportComment("");
          setSupportCommentError("");
        },
      }
    );
  };

  const handleSyncNow = () => {
    setSyncMessage("");
    syncNow.mutate(undefined, {
      onSuccess: () => setSyncMessage("Datos locales actualizados."),
      onError: () => setSyncMessage("No se pudieron actualizar los datos locales."),
    });
  };

  return (
    <div>
      <Dialog open={!!pendingCommentAction} onOpenChange={(open) => !open && closeCommentDialog()}>
        <DialogContent className="w-[92vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>Comentario para el cliente</DialogTitle>
            <DialogDescription>
              Para marcar este ticket como {pendingCommentAction?.status ?? ""}, escribe un comentario de soporte.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Textarea
              value={supportComment}
              onChange={(e) => {
                setSupportComment(e.target.value);
                if (supportCommentError) setSupportCommentError("");
              }}
              placeholder="Ejemplo: Se reemplazó el equipo y quedó funcionando correctamente."
              className="min-h-[120px] resize-none"
            />
            {supportCommentError && <p className="text-sm text-red-500">{supportCommentError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeCommentDialog} disabled={updateStatus.isPending}>
              Cancelar
            </Button>
            <Button type="button" onClick={submitCommentAndUpdate} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? "Guardando..." : "Guardar y actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <h2 className="text-2xl font-bold mb-6">Panel de Técnico</h2>
      <p className="text-slate-600 mb-6">
        Aquí puedes ver y actualizar tus tickets asignados.
      </p>
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncNow.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${syncNow.isPending ? "animate-spin" : ""}`} />
          {syncNow.isPending ? "Actualizando..." : "Actualizar datos locales"}
        </button>
        {syncMessage && <span className="text-xs text-slate-500">{syncMessage}</span>}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white rounded-xl shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{total}</p>
              <p className="text-sm text-slate-500">Asignados Totales</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pendientes}</p>
              <p className="text-sm text-slate-500">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{enProceso}</p>
              <p className="text-sm text-slate-500">En Proceso</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{resueltos}</p>
              <p className="text-sm text-slate-500">Resueltos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Mis Tickets Asignados */}
      <div className="p-4 sm:p-6 bg-white rounded-xl shadow border border-slate-100">
        <h3 className="font-semibold text-lg mb-1">Mis Tickets Asignados</h3>
        <p className="text-sm text-slate-500 mb-4">Listado de tickets y acciones</p>
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando tickets...
          </div>
        )}
        {error && (
          <p className="text-red-500 py-4">No se pudieron cargar los tickets locales.</p>
        )}
        {!isLoading && !error && list.length === 0 && (
          <p className="text-slate-500 py-8">No hay tickets asignados todavía.</p>
        )}
        {!isLoading && !error && list.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Ticket</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Descripción</th>
                  <th className="pb-3 font-medium">Fecha creado</th>
                  <th className="pb-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 font-medium text-slate-900">{t.ticket_number}</td>
                    <td className="py-3 align-top">
                      <ClientTypeCell clientType={t.client_type} rnc={t.rnc} />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 text-slate-700">{(t.product != null && t.product !== "") ? t.product : "—"}</td>
                    <td className="py-3 text-slate-600 max-w-xs truncate" title={t.description != null ? String(t.description) : ""}>
                      {(t.description != null && t.description !== "") ? String(t.description) : "—"}
                    </td>
                    <td className="py-3 text-slate-500">
                      {t.created_at ? format(new Date(t.created_at), "dd MMM yyyy", { locale: es }) : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-block">
                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(e, t.ticket_number)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                          aria-label="Acciones"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenu === t.ticket_number &&
                          createPortal(
                            <>
                              <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpenMenu(null)} />
                              <ul
                                className="fixed w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 list-none m-0"
                                style={{ top: menuPosition.top, left: menuPosition.left }}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <li key={opt.value}>
                                    <button
                                      type="button"
                                      onClick={(ev) => { ev.stopPropagation(); handleStatusChange(t.ticket_number, opt.value); }}
                                      disabled={updateStatus.isPending || t.status === opt.value}
                                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 border-0 bg-transparent cursor-pointer"
                                    >
                                      {opt.label}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </>,
                            document.body
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
