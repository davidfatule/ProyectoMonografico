import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ticket, ChevronLeft, CheckCircle, X } from "lucide-react";
import { PublicLayout } from "@/Layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/api/endpoints";
import { useCreateTicket } from "@/hooks/tickets";
import type { DefaultValues } from "react-hook-form";

const PRODUCTS = ["Router", "NVR", "XVR", "Camara CCTV", "Switch", "OLT", "ONUs", "UPS", "Fibra Optica", "Control de Acceso", "Control de Asistencia", "Rack", "Cable UTP"];
const BRANCHES = ["Localidad Ozama - Principal", "KM-9", "Localidad Santiago", "Localidad Punta Cana"];

const CLIENT_TYPE_OPTIONS = [
  { value: "individual" as const, label: "Individual" },
  { value: "negocio" as const, label: "Negocio" },
  { value: "empresa" as const, label: "Empresa" },
];

/** Campos de formulario: mismo aspecto en claro y oscuro (evita mezcla blanco/negro). */
const fieldInputClass =
  "h-9 w-full rounded-md border px-2.5 py-2 text-sm text-slate-900 bg-white border-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

const fieldSelectClass =
  "h-9 w-full rounded-md border px-2.5 py-2 text-sm text-slate-900 bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

const fieldTextareaClass =
  "min-h-[88px] w-full resize-none rounded-md border px-3 py-2 text-sm text-slate-900 bg-white border-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

const labelClass = "text-sm font-medium text-slate-800 dark:text-slate-200";

const sectionTitleClass =
  "text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 pb-1 mb-2";

const ticketCreateSchema = api.tickets.create.input;
type FormValues = z.output<typeof ticketCreateSchema>;

const emptyDefaults: DefaultValues<FormValues> = {
  status: "Pendiente",
  branch: "",
  purchaseDate: "",
  phone: "",
  email: "",
  product: "",
  serialNumber: "",
  description: "",
  taxCredit: "",
  rnc: "",
  fileUrl: "",
};

export default function NewTicket() {
  const [, setLocation] = useLocation();
  const createTicket = useCreateTicket();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [successTicketNumber, setSuccessTicketNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(ticketCreateSchema) as Resolver<FormValues>,
    defaultValues: emptyDefaults,
  });

  const clientType = form.watch("clientType");
  const showFiscalFields = clientType === "empresa" || clientType === "negocio";

  const setValue = form.setValue;
  const clearErrors = form.clearErrors;
  useEffect(() => {
    if (clientType === "individual") {
      setValue("taxCredit", "");
      setValue("rnc", "");
      clearErrors("taxCredit");
      clearErrors("rnc");
    }
  }, [clientType, setValue, clearErrors]);

  const onSubmit = (data: FormValues) => {
    setSubmitError("");
    createTicket.mutate(data, {
      onSuccess: (response) => {
        setSuccessTicketNumber(response.ticketNumber);
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "No se pudo crear el ticket.";
        setSubmitError(message);
      },
    });
  };

  const goToTicketStatus = () => {
    if (successTicketNumber) {
      setLocation(`/ticket/${successTicketNumber}/status`);
      setSuccessTicketNumber(null);
    }
  };

  const closeSuccessModal = () => {
    setSuccessTicketNumber(null);
    form.reset(emptyDefaults);
    setSelectedFiles([]);
  };

  return (
    <PublicLayout>
      {/* Modal de éxito al crear ticket */}
      <Dialog open={!!successTicketNumber} onOpenChange={(open) => !open && closeSuccessModal()}>
        <div className="w-full max-w-md relative">
          <button
            type="button"
            onClick={closeSuccessModal}
            className="absolute top-0 right-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center pt-2">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/60">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">¡Solicitud Registrada!</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Tu incidencia ha sido creada exitosamente. Guarda el siguiente número de ticket para consultar su estado:
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 mb-1">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">Número de Ticket</p>
              <p className="text-xl font-bold text-[#347AFF]">{successTicketNumber}</p>
            </div>
            <Button
              type="button"
              onClick={goToTicketStatus}
              className="w-full mt-6 h-10 rounded-lg bg-gradient-to-r from-primary to-blue-600 shadow-md"
            >
              Ver estado del ticket
            </Button>
          </div>
        </div>
      </Dialog>

      <div className="-mt-1 w-full sm:mt-0">
        {/* Misma malla horizontal que el header: “Volver” alineado con el logo */}
        <div className="app-shell-wide mx-auto w-full px-5 pb-0 pt-3 sm:px-8 sm:pt-4">
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-1.5 text-sm sm:text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded text-[#347AFF] hover:text-[#2860d9] dark:text-primary dark:hover:text-primary/90 touch-manipulation py-0.5 min-h-0 -ml-1 px-1"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
            Volver
          </button>
        </div>

        <div className="mx-auto w-full max-w-xl px-4 sm:px-6 pt-0 pb-[max(3rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 sm:mb-4">
            <h1 className="text-3xl font-display font-bold leading-tight text-slate-900 dark:text-slate-100">
              Registrar Incidencia
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm sm:text-base">
              Completa el formulario para abrir un nuevo ticket de soporte.
            </p>
          </div>

        {/* Tarjeta: fondo y texto coherentes en modo claro / oscuro */}
        <div className="rounded-2xl border border-slate-100/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)] sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Información del Cliente / Compra */}
            <div>
              <h3 className={sectionTitleClass}>Detalles de Compra</h3>

              <div className="mb-3 space-y-1">
                <Label className={labelClass}>Compra registrada como *</Label>
                <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                  Empresa o negocio requieren comprobante fiscal y RNC. Individual no aplica esos datos.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {CLIENT_TYPE_OPTIONS.map(({ value, label }) => {
                    const active = clientType === value;
                    return (
                      <label
                        key={value}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-[#347AFF] bg-[#347AFF]/10 text-[#347AFF] shadow-sm dark:bg-primary/15 dark:text-primary"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                        }`}
                      >
                        <input type="radio" value={value} className="sr-only" {...form.register("clientType")} />
                        {label}
                      </label>
                    );
                  })}
                </div>
                {form.formState.errors.clientType && (
                  <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.clientType.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Sucursal *</Label>
                  <select
                    {...form.register("branch", { required: true })}
                    className={`${fieldSelectClass} ${
                      form.formState.errors.branch ? "border-red-500 dark:border-red-500" : ""
                    }`}
                  >
                    <option value="">Seleccione sucursal</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Fecha de Compra *</Label>
                  <Input
                    type="date"
                    {...form.register("purchaseDate")}
                    className={`${fieldInputClass} ${form.formState.errors.purchaseDate ? "border-red-500 dark:border-red-500" : ""}`}
                  />
                </div>
                {showFiscalFields && (
                  <>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Comprobante fiscal *</Label>
                      <Input
                        placeholder="B01..."
                        className={`${fieldInputClass} ${form.formState.errors.taxCredit ? "border-red-500 dark:border-red-500" : ""}`}
                        {...form.register("taxCredit")}
                      />
                      {form.formState.errors.taxCredit && (
                        <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.taxCredit.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>RNC *</Label>
                      <Input
                        placeholder="Ej. 130... o 101..."
                        className={`${fieldInputClass} ${form.formState.errors.rnc ? "border-red-500 dark:border-red-500" : ""}`}
                        {...form.register("rnc")}
                      />
                      {form.formState.errors.rnc && (
                        <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.rnc.message}</p>
                      )}
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label className={labelClass}>Teléfono de Contacto *</Label>
                  <Input
                    type="tel"
                    placeholder="Ej. 809-123-4567"
                    autoComplete="tel"
                    className={`${fieldInputClass} ${form.formState.errors.phone ? "border-red-500 dark:border-red-500" : ""}`}
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Correo electrónico *</Label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    className={`${fieldInputClass} ${form.formState.errors.email ? "border-red-500 dark:border-red-500" : ""}`}
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-600 dark:text-red-400">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Información del Producto */}
            <div>
              <h3 className={sectionTitleClass}>Información del Equipo</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Tipo de Producto *</Label>
                  <select
                    {...form.register("product", { required: true })}
                    className={`${fieldSelectClass} ${
                      form.formState.errors.product ? "border-red-500 dark:border-red-500" : ""
                    }`}
                  >
                    <option value="">Seleccione equipo</option>
                    {PRODUCTS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Número de Serie *</Label>
                  <Input
                    placeholder="S/N del equipo"
                    className={`${fieldInputClass} ${form.formState.errors.serialNumber ? "border-red-500 dark:border-red-500" : ""}`}
                    {...form.register("serialNumber")}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className={labelClass}>Descripción del Problema *</Label>
                  <Textarea
                    placeholder="Por favor, describe detalladamente la falla o problema que presenta el equipo..."
                    className={`${fieldTextareaClass} ${form.formState.errors.description ? "border-red-500 dark:border-red-500" : ""}`}
                    {...form.register("description")}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className={labelClass}>Adjuntar archivos (Opcional)</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    Imágenes, PDF, documentos (Word, etc.). Múltiples archivos permitidos.
                  </p>
                  <div className="flex flex-col items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/80 dark:hover:bg-slate-800">
                      <div className="flex flex-col items-center justify-center pt-3 pb-4">
                        <Ticket className="mb-1.5 h-6 w-6 text-slate-400 dark:text-slate-500" />
                        <p className="px-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                          Clic para subir imágenes, PDF o documentos
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        multiple
                        onChange={(e) => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                      />
                    </label>
                    {selectedFiles.length > 0 && (
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                        {selectedFiles.length} archivo(s): {selectedFiles.map((f) => f.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={createTicket.isPending}
                className="w-full sm:w-auto px-6 rounded-lg h-9 bg-gradient-to-r from-primary to-blue-600 shadow-md shadow-primary/25"
              >
                {createTicket.isPending ? "Procesando..." : "Crear Ticket"}
              </Button>
            </div>
            {submitError && (
              <p className="text-right text-sm text-red-600 dark:text-red-400">{submitError}</p>
            )}
            {Object.keys(form.formState.errors).length > 0 && (
              <p className="text-right text-sm text-red-600 dark:text-red-400">
                Por favor, completa todos los campos requeridos (*).
              </p>
            )}
          </form>
        </div>
        </div>
      </div>
    </PublicLayout>
  );
}
