import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, Link } from "wouter";
import {
  format,
  startOfDay,
  endOfDay,
  isWithinInterval,
  subDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, MoreVertical } from "lucide-react";
import { DashboardLayout } from "@/Layouts/DashboardLayout";
import { useUser } from "@/hooks/auth";
import { useTickets, useTicketByNumber, useUpdateTicket } from "@/hooks/tickets";
import { TEMP_USERS } from "@/lib/mockAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type TicketRow = {
  id: number;
  ticket_number: string;
  status: string;
  product?: string | null;
  description?: string | null;
  created_at: string;
};

type DatePreset = "all" | "today" | "week" | "month" | "custom";

const PRODUCTS = [
  "Router",
  "NVR",
  "XVR",
  "Camara CCTV",
  "Switch",
  "OLT",
  "ONUs",
  "UPS",
  "Fibra Optica",
  "Control de Acceso",
  "Control de Asistencia",
  "Rack",
  "Cable UTP",
];
const BRANCHES = ["Localidad Ozama - Principal", "KM-9", "Localidad Santiago", "Localidad Punta Cana"];
const STATUS_OPTIONS = ["Pendiente", "En Proceso", "Resuelto", "Rechazado", "Descartado"];

function filterByDatePreset(
  createdAt: string,
  preset: DatePreset,
  customFrom: string,
  customTo: string
): boolean {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return true;
  const now = new Date();
  if (preset === "all") return true;
  if (preset === "today") {
    return isWithinInterval(d, { start: startOfDay(now), end: endOfDay(now) });
  }
  if (preset === "week") {
    return isWithinInterval(d, { start: startOfDay(subDays(now, 6)), end: endOfDay(now) });
  }
  if (preset === "month") {
    return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
  }
  if (preset === "custom" && customFrom && customTo) {
    return isWithinInterval(d, {
      start: startOfDay(new Date(customFrom)),
      end: endOfDay(new Date(customTo)),
    });
  }
  return true;
}

function StatusCell({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pendiente: "bg-red-100 text-red-800",
    "En Proceso": "bg-blue-100 text-blue-800",
    Resuelto: "bg-emerald-100 text-emerald-800",
    Rechazado: "bg-red-100 text-red-800",
    Descartado: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

type EditFormState = {
  status: string;
  branch: string;
  purchaseDate: string;
  phone: string;
  product: string;
  serialNumber: string;
  description: string;
  taxCredit: string;
  rnc: string;
  supportComment: string;
  assigneeUsername: string;
};

function ticketToEditForm(t: {
  status: string;
  branch: string;
  purchaseDate: string;
  phone: string;
  product: string;
  serialNumber: string;
  description: string;
  taxCredit?: string;
  rnc?: string;
  supportComment?: string;
  assignee?: { username: string } | null;
}): EditFormState {
  return {
    status: t.status,
    branch: t.branch,
    purchaseDate: t.purchaseDate,
    phone: t.phone,
    product: t.product,
    serialNumber: t.serialNumber,
    description: t.description,
    taxCredit: t.taxCredit ?? "",
    rnc: t.rnc ?? "",
    supportComment: t.supportComment ?? "",
    assigneeUsername: t.assignee?.username ?? "",
  };
}

function TicketEditDialogContent({
  ticketNumber,
  onClose,
}: {
  ticketNumber: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useTicketByNumber(ticketNumber);
  const updateTicket = useUpdateTicket();

  if (isLoading || !data) {
    return (
      <DialogContent className="w-[92vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DialogContent>
    );
  }

  return (
    <TicketEditFormFields
      key={ticketNumber}
      ticketNumber={ticketNumber}
      initialTicket={data}
      onClose={onClose}
      updateTicket={updateTicket}
    />
  );
}

function TicketEditFormFields({
  ticketNumber,
  initialTicket,
  onClose,
  updateTicket,
}: {
  ticketNumber: string;
  initialTicket: Parameters<typeof ticketToEditForm>[0];
  onClose: () => void;
  updateTicket: ReturnType<typeof useUpdateTicket>;
}) {
  const [form, setForm] = useState<EditFormState>(() => ticketToEditForm(initialTicket));
  const [editError, setEditError] = useState("");

  const saveEdit = () => {
    if (!form.description.trim()) {
      setEditError("La descripción es obligatoria.");
      return;
    }
    setEditError("");
    updateTicket.mutate(
      {
        ticketNumber,
        patch: {
          status: form.status,
          branch: form.branch,
          purchaseDate: form.purchaseDate,
          phone: form.phone,
          product: form.product,
          serialNumber: form.serialNumber,
          description: form.description.trim(),
          taxCredit: form.taxCredit.trim() || undefined,
          rnc: form.rnc.trim() || undefined,
          supportComment: form.supportComment.trim() || undefined,
          assignee: form.assigneeUsername.trim()
            ? { username: form.assigneeUsername.trim() }
            : null,
        },
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <DialogContent className="w-[92vw] max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Editar ticket</DialogTitle>
        <DialogDescription>
          Corrige datos si hubo un error. El número de ticket no se puede cambiar.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <p className="text-sm font-mono text-slate-600">{ticketNumber}</p>

        <div className="space-y-1">
          <Label className="text-sm">Estado</Label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full h-9 text-sm rounded-md border border-slate-200 bg-white px-2.5"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Sucursal</Label>
          <select
            value={form.branch}
            onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
            className="w-full h-9 text-sm rounded-md border border-slate-200 bg-white px-2.5"
          >
            <option value="">—</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Fecha compra</Label>
            <Input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Teléfono</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Producto</Label>
          <select
            value={form.product}
            onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
            className="w-full h-9 text-sm rounded-md border border-slate-200 bg-white px-2.5"
          >
            <option value="">—</option>
            {PRODUCTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Número de serie</Label>
          <Input
            value={form.serialNumber}
            onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Descripción *</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="min-h-[88px] resize-none text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Comprobante fiscal</Label>
            <Input
              value={form.taxCredit}
              onChange={(e) => setForm((f) => ({ ...f, taxCredit: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">RNC</Label>
            <Input value={form.rnc} onChange={(e) => setForm((f) => ({ ...f, rnc: e.target.value }))} className="h-9" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Comentario soporte (cliente)</Label>
          <Textarea
            value={form.supportComment}
            onChange={(e) => setForm((f) => ({ ...f, supportComment: e.target.value }))}
            className="min-h-[72px] resize-none text-sm"
            placeholder="Visible en la vista pública del ticket"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Técnico asignado (usuario)</Label>
          <select
            value={form.assigneeUsername}
            onChange={(e) => setForm((f) => ({ ...f, assigneeUsername: e.target.value }))}
            className="w-full h-9 text-sm rounded-md border border-slate-200 bg-white px-2.5"
          >
            <option value="">Sin asignar</option>
            {TEMP_USERS.map(({ user: u }) => (
              <option key={u.id} value={u.username}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {editError && <p className="text-sm text-red-500">{editError}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={updateTicket.isPending}>
          Cancelar
        </Button>
        <Button type="button" onClick={saveEdit} disabled={updateTicket.isPending}>
          {updateTicket.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function Tickets() {
  const { data: user, isLoading: isUserLoading, error: userError } = useUser();
  const { data: tickets, isLoading, error } = useTickets();
  const [, setLocation] = useLocation();

  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const [editTicketNumber, setEditTicketNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && (!user || userError)) {
      setLocation("/login");
    }
  }, [user, isUserLoading, userError, setLocation]);

  useEffect(() => {
    const close = () => setOpenMenu(null);
    if (openMenu) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [openMenu]);

  const list = useMemo(() => (tickets || []) as TicketRow[], [tickets]);

  const filteredList = useMemo(() => {
    return list.filter((t) => filterByDatePreset(t.created_at, datePreset, customFrom, customTo));
  }, [list, datePreset, customFrom, customTo]);

  const handleOpenMenu = (e: React.MouseEvent, ticketNumber: string) => {
    e.stopPropagation();
    if (openMenu === ticketNumber) {
      setOpenMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 4, left: rect.right - 192 });
    setOpenMenu(ticketNumber);
  };

  const closeEdit = () => setEditTicketNumber(null);

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const presetButtons: { key: DatePreset; label: string }[] = [
    { key: "all", label: "Todo" },
    { key: "today", label: "Hoy" },
    { key: "week", label: "Últimos 7 días" },
    { key: "month", label: "Este mes" },
    { key: "custom", label: "Rango" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 bg-white rounded-xl shadow border border-slate-100">
        <h2 className="text-2xl font-bold mb-2">Tickets</h2>
        <p className="text-slate-600 mb-4">Listado general de todos los tickets registrados.</p>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Filtrar por fecha</p>
            <div className="flex flex-wrap gap-2">
              {presetButtons.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDatePreset(key)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${
                    datePreset === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {datePreset === "custom" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Desde</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-9 w-40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Hasta</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-9 w-40"
                />
              </div>
              {(!customFrom || !customTo) && (
                <p className="text-xs text-amber-600 pb-2">Selecciona ambas fechas para aplicar el filtro.</p>
              )}
            </div>
          )}
        </div>

        <Dialog open={!!editTicketNumber} onOpenChange={(open) => !open && closeEdit()}>
          {editTicketNumber && <TicketEditDialogContent ticketNumber={editTicketNumber} onClose={closeEdit} />}
        </Dialog>

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando tickets...
          </div>
        )}

        {error && <p className="text-red-500 py-4">No se pudieron cargar los tickets.</p>}

        {!isLoading && !error && list.length === 0 && (
          <p className="text-slate-500 py-8">No hay tickets registrados todavía.</p>
        )}

        {!isLoading && !error && list.length > 0 && filteredList.length === 0 && (
          <p className="text-slate-500 py-8">No hay tickets en el rango de fechas seleccionado.</p>
        )}

        {!isLoading && !error && filteredList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Ticket</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Descripción</th>
                  <th className="pb-3 font-medium">Fecha creado</th>
                  <th className="pb-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 font-medium text-slate-900">{t.ticket_number}</td>
                    <td className="py-3">
                      <StatusCell status={t.status} />
                    </td>
                    <td className="py-3 text-slate-700">{t.product && t.product !== "" ? t.product : "—"}</td>
                    <td
                      className="py-3 text-slate-600 max-w-xs truncate"
                      title={t.description != null ? String(t.description) : ""}
                    >
                      {t.description && t.description !== "" ? String(t.description) : "—"}
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
                                className="fixed w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 list-none m-0"
                                style={{ top: menuPosition.top, left: menuPosition.left }}
                              >
                                <li>
                                  <button
                                    type="button"
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 border-0 bg-transparent cursor-pointer"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      setOpenMenu(null);
                                      setEditTicketNumber(t.ticket_number);
                                    }}
                                  >
                                    Editar ticket
                                  </button>
                                </li>
                                <li>
                                  <Link href={`/ticket/${t.ticket_number}/status`}>
                                    <a
                                      className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 no-underline"
                                      onClick={() => setOpenMenu(null)}
                                    >
                                      Ver vista cliente
                                    </a>
                                  </Link>
                                </li>
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
    </DashboardLayout>
  );
}
