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
import { Download, Loader2, MoreVertical } from "lucide-react";
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
import { ClientTypeCell } from "@/components/ClientTypeCell";

type TicketRow = {
  id: number;
  ticket_number: string;
  status: string;
  product?: string | null;
  description?: string | null;
  created_at: string;
  assignee_username?: string | null;
  support_comment?: string | null;
  client_type?: string | null;
  rnc?: string | null;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  }>;
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

const dashCard =
  "rounded-xl border border-slate-100/80 bg-white shadow dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]";
const dashSelect =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
const dashFieldInput =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

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

function getAssigneeDisplay(username: string | null | undefined): { primary: string; secondary?: string } {
  if (!username?.trim()) return { primary: "Sin asignar" };
  const normalized = username.trim().toLowerCase();
  const match = TEMP_USERS.find((t) => t.user.username.toLowerCase() === normalized);
  if (match) {
    return { primary: match.user.name, secondary: match.user.username };
  }
  return { primary: username.trim() };
}

/** Mantiene el menú contextual dentro del viewport en móviles y TV de baja resolución. */
function clampDropdownLeft(triggerRight: number, menuWidthPx: number): number {
  const margin = 8;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const preferred = triggerRight - menuWidthPx;
  return Math.min(Math.max(margin, preferred), vw - menuWidthPx - margin);
}

function escapeCsvField(value: string): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Exporta el listado visible (respeta filtros de fecha) como CSV para Excel. */
function downloadTicketsCsv(rows: TicketRow[]): void {
  const headers = [
    "Ticket",
    "Tipo cliente",
    "RNC",
    "Estado",
    "Producto",
    "Descripción",
    "Asignado",
    "Correo asignado",
    "Comentario soporte",
    "Fecha creado",
  ];
  const lines: string[] = [headers.map(escapeCsvField).join(",")];
  for (const t of rows) {
    const { primary, secondary } = getAssigneeDisplay(t.assignee_username);
    const assigneeName = primary === "Sin asignar" ? "" : primary;
    const assigneeEmail =
      secondary ?? (t.assignee_username?.trim() ? t.assignee_username.trim() : "");
    const dateStr = t.created_at
      ? format(new Date(t.created_at), "dd MMM yyyy", { locale: es })
      : "";
    const tipoCliente =
      t.client_type === "empresa"
        ? "Empresa"
        : t.client_type === "negocio"
          ? "Negocio"
          : t.client_type === "individual"
            ? "Individual"
            : "";
    const rncCsv =
      t.client_type === "empresa" || t.client_type === "negocio"
        ? (t.rnc ?? "").trim()
        : "";
    lines.push(
      [
        escapeCsvField(t.ticket_number),
        escapeCsvField(tipoCliente),
        escapeCsvField(rncCsv),
        escapeCsvField(t.status),
        escapeCsvField(t.product && t.product !== "" ? String(t.product) : ""),
        escapeCsvField(t.description != null ? String(t.description) : ""),
        escapeCsvField(assigneeName),
        escapeCsvField(assigneeEmail),
        escapeCsvField(t.support_comment ?? ""),
        escapeCsvField(dateStr),
      ].join(",")
    );
  }
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tickets_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function AssigneeCell({
  username,
  supportComment,
  status,
}: {
  username: string | null | undefined;
  supportComment: string | null | undefined;
  status: string;
}) {
  const { primary, secondary } = getAssigneeDisplay(username);
  const hint = [
    username?.trim() ? `Asignado a: ${username.trim()}` : "Sin técnico asignado",
    `Estado del ticket: ${status}`,
    supportComment?.trim() ? `Comentario de soporte: ${supportComment.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="min-w-[9rem] max-w-[14rem]" title={hint}>
      <div className="flex flex-col gap-0.5">
        <span
          className={`truncate font-medium ${username?.trim() ? "text-slate-800 dark:text-slate-200" : "text-slate-400 italic dark:text-slate-500"}`}
        >
          {primary}
        </span>
        {secondary && (
          <span className="truncate text-xs text-slate-500 dark:text-slate-400" title={secondary}>
            {secondary}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusCell({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pendiente: "bg-red-100 text-red-800 dark:bg-red-950/55 dark:text-red-200",
    "En Proceso": "bg-blue-100 text-blue-800 dark:bg-blue-950/55 dark:text-blue-200",
    Resuelto: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-200",
    Rechazado: "bg-red-100 text-red-800 dark:bg-red-950/55 dark:text-red-200",
    Descartado: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"}`}
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
  email: string;
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
  email?: string;
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
    email: t.email ?? "",
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
          email: form.email.trim(),
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
        <p className="font-mono text-sm text-slate-600 dark:text-slate-400">{ticketNumber}</p>

        <div className="space-y-1">
          <Label className="text-sm">Estado</Label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className={dashSelect}
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
            className={dashSelect}
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
              className={`h-9 ${dashFieldInput}`}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Teléfono</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={`h-9 ${dashFieldInput}`}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-sm">Correo electrónico</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={`h-9 ${dashFieldInput}`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Producto</Label>
          <select
            value={form.product}
            onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
            className={dashSelect}
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
            className={`h-9 ${dashFieldInput}`}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Descripción *</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={`min-h-[88px] resize-none text-sm ${dashFieldInput} placeholder:text-slate-400 dark:placeholder:text-slate-500`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Comprobante fiscal</Label>
            <Input
              value={form.taxCredit}
              onChange={(e) => setForm((f) => ({ ...f, taxCredit: e.target.value }))}
              className={`h-9 ${dashFieldInput}`}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">RNC</Label>
            <Input
              value={form.rnc}
              onChange={(e) => setForm((f) => ({ ...f, rnc: e.target.value }))}
              className={`h-9 ${dashFieldInput}`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Comentario soporte (cliente)</Label>
          <Textarea
            value={form.supportComment}
            onChange={(e) => setForm((f) => ({ ...f, supportComment: e.target.value }))}
            className={`min-h-[72px] resize-none text-sm ${dashFieldInput} placeholder:text-slate-400 dark:placeholder:text-slate-500`}
            placeholder="Visible en la vista pública del ticket"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Técnico asignado (usuario)</Label>
          <select
            value={form.assigneeUsername}
            onChange={(e) => setForm((f) => ({ ...f, assigneeUsername: e.target.value }))}
            className={dashSelect}
          >
            <option value="">Sin asignar</option>
            {TEMP_USERS.map(({ user: u }) => (
              <option key={u.id} value={u.username}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {editError && <p className="text-sm text-red-500 dark:text-red-400">{editError}</p>}
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
  const [galleryTicket, setGalleryTicket] = useState<TicketRow | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
  const galleryImages = (galleryTicket?.attachments ?? []).filter(
    (attachment) => attachment.type?.toLowerCase().startsWith("image/") && !!attachment.dataUrl
  );

  const handleOpenMenu = (e: React.MouseEvent, ticketNumber: string) => {
    e.stopPropagation();
    if (openMenu === ticketNumber) {
      setOpenMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuW = 208; /* w-52 */
    setMenuPosition({ top: rect.bottom + 4, left: clampDropdownLeft(rect.right, menuW) });
    setOpenMenu(ticketNumber);
  };

  const closeEdit = () => setEditTicketNumber(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin && editTicketNumber) setEditTicketNumber(null);
  }, [isAdmin, editTicketNumber]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className={`${dashCard} p-4 sm:p-6`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Tickets</h2>
            <p className="m-0 text-slate-600 dark:text-slate-400">Listado general de todos los tickets registrados.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="group inline-flex h-8 shrink-0 items-center gap-2 self-end rounded-lg border border-slate-200/90 bg-white px-3.5 text-xs font-medium text-slate-800 shadow-[0_3px_14px_-3px_rgba(15,23,42,0.12),0_1px_6px_-2px_rgba(15,23,42,0.07)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#347AFF]/45 hover:bg-slate-50/90 hover:text-[#2563EB] hover:shadow-[0_10px_28px_-8px_rgba(52,122,255,0.24),0_4px_12px_-6px_rgba(15,23,42,0.1)] active:translate-y-0 active:shadow-md disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45 disabled:shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)] sm:self-start dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-primary"
            disabled={isLoading || filteredList.length === 0}
            onClick={() => downloadTicketsCsv(filteredList)}
          >
            <Download className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-105" aria-hidden />
            Descargar CSV
          </Button>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Filtrar por fecha
            </p>
            <div className="flex flex-wrap gap-2">
              {presetButtons.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDatePreset(key)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    datePreset === key
                      ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
                <Label className="text-xs text-slate-600 dark:text-slate-400">Desde</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className={`h-9 w-40 ${dashFieldInput}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-slate-400">Hasta</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className={`h-9 w-40 ${dashFieldInput}`}
                />
              </div>
              {(!customFrom || !customTo) && (
                <p className="pb-2 text-xs text-amber-600 dark:text-amber-400">Selecciona ambas fechas para aplicar el filtro.</p>
              )}
            </div>
          )}
        </div>

        <Dialog open={!!editTicketNumber && isAdmin} onOpenChange={(open) => !open && closeEdit()}>
          {editTicketNumber && isAdmin && (
            <TicketEditDialogContent ticketNumber={editTicketNumber} onClose={closeEdit} />
          )}
        </Dialog>
        <Dialog
          open={!!galleryTicket}
          onOpenChange={(open) => {
            if (!open) {
              setGalleryTicket(null);
              setActiveImageIndex(0);
            }
          }}
        >
          <DialogContent className="w-[95vw] max-w-3xl">
            <DialogHeader>
              <DialogTitle>Imágenes del ticket {galleryTicket?.ticket_number ?? ""}</DialogTitle>
              <DialogDescription>
                {galleryImages.length > 0
                  ? `${galleryImages.length} imagen(es) registrada(s) por el cliente.`
                  : "Este ticket no tiene imágenes registradas."}
              </DialogDescription>
            </DialogHeader>
            {galleryImages.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/40">
                  <img
                    src={galleryImages[activeImageIndex]?.dataUrl}
                    alt={galleryImages[activeImageIndex]?.name ?? "Imagen del ticket"}
                    className="max-h-[55vh] w-auto rounded-md object-contain"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {galleryImages.map((image, idx) => (
                    <button
                      key={`${image.name}-${idx}`}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`rounded-md border px-2 py-1 text-xs ${
                        idx === activeImageIndex
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      Imagen {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Imagen no registrada.</p>
            )}
          </DialogContent>
        </Dialog>

        {isLoading && (
          <div className="flex items-center gap-2 py-8 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando tickets...
          </div>
        )}

        {error && <p className="py-4 text-red-500 dark:text-red-400">No se pudieron cargar los tickets.</p>}

        {!isLoading && !error && list.length === 0 && (
          <p className="py-8 text-slate-500 dark:text-slate-400">No hay tickets registrados todavía.</p>
        )}

        {!isLoading && !error && list.length > 0 && filteredList.length === 0 && (
          <p className="py-8 text-slate-500 dark:text-slate-400">No hay tickets en el rango de fechas seleccionado.</p>
        )}

        {!isLoading && !error && filteredList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left uppercase tracking-wider text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  <th className="pb-3 font-medium">Ticket</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Descripción</th>
                  <th className="pb-3 font-medium">Asignado / seguimiento</th>
                  <th className="pb-3 font-medium">Imágenes</th>
                  <th className="pb-3 font-medium">Fecha creado</th>
                  <th className="pb-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-100">{t.ticket_number}</td>
                    <td className="py-3 align-top">
                      <ClientTypeCell clientType={t.client_type} rnc={t.rnc} />
                    </td>
                    <td className="py-3">
                      <StatusCell status={t.status} />
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{t.product && t.product !== "" ? t.product : "—"}</td>
                    <td
                      className="max-w-xs truncate py-3 text-slate-600 dark:text-slate-400"
                      title={t.description != null ? String(t.description) : ""}
                    >
                      {t.description && t.description !== "" ? String(t.description) : "—"}
                    </td>
                    <td className="py-3 align-top">
                      <AssigneeCell
                        username={t.assignee_username}
                        supportComment={t.support_comment}
                        status={t.status}
                      />
                    </td>
                    <td className="py-3">
                      {(t.attachments ?? []).some((attachment) => attachment.type?.toLowerCase().startsWith("image/")) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGalleryTicket(t);
                            setActiveImageIndex(0);
                          }}
                        >
                          Ver imágenes
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Imagen no registrada</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {t.created_at ? format(new Date(t.created_at), "dd MMM yyyy", { locale: es }) : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-block">
                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(e, t.ticket_number)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label="Acciones"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenu === t.ticket_number &&
                          createPortal(
                            <>
                              <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpenMenu(null)} />
                              <ul
                                className="fixed z-50 m-0 w-52 list-none rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-600 dark:bg-slate-900"
                                style={{ top: menuPosition.top, left: menuPosition.left }}
                              >
                                {isAdmin && (
                                  <li>
                                    <button
                                      type="button"
                                      className="w-full cursor-pointer border-0 bg-transparent px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        setOpenMenu(null);
                                        setEditTicketNumber(t.ticket_number);
                                      }}
                                    >
                                      Editar ticket
                                    </button>
                                  </li>
                                )}
                                <li>
                                  <Link href={`/ticket/${t.ticket_number}/status`}>
                                    <a
                                      className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 no-underline hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
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
