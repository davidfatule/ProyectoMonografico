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

const ticketCreateSchema = api.tickets.create.input;
type FormValues = z.output<typeof ticketCreateSchema>;

const emptyDefaults: DefaultValues<FormValues> = {
  status: "Pendiente",
  branch: "",
  purchaseDate: "",
  phone: "",
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
            className="absolute top-0 right-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">¡Solicitud Registrada!</h2>
            <p className="text-sm text-slate-600 mb-4">
              Tu incidencia ha sido creada exitosamente. Guarda el siguiente número de ticket para consultar su estado:
            </p>
            <div className="bg-slate-100 rounded-lg px-4 py-3 mb-1">
              <p className="text-xs text-slate-600 mb-0.5">Número de Ticket</p>
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

      <div className="w-full app-shell-wide max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12 pb-[max(3rem,env(safe-area-inset-bottom))]">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-1.5 text-base font-medium mb-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded text-[#347AFF] hover:text-[#2860d9]"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver
          </button>
          <h1 className="text-3xl font-display font-bold text-slate-900">Registrar Incidencia</h1>
          <p className="text-slate-500 mt-1">Completa el formulario para abrir un nuevo ticket de soporte.</p>
        </div>

        {/* Contenedor que sobresale: tarjeta blanca con sombra */}
        <div
          className="rounded-2xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100/80"
          style={{ backgroundColor: "#ffffff" }}
        >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Información del Cliente / Compra */}
            <div>
              <h3 className="text-base font-semibold border-b pb-1 mb-2">Detalles de Compra</h3>

              <div className="mb-3 space-y-1">
                <Label className="text-sm font-medium text-slate-800">Compra registrada como *</Label>
                <p className="text-[11px] leading-snug text-slate-500">
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
                            ? "border-[#347AFF] bg-[#347AFF]/10 text-[#347AFF] shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input type="radio" value={value} className="sr-only" {...form.register("clientType")} />
                        {label}
                      </label>
                    );
                  })}
                </div>
                {form.formState.errors.clientType && (
                  <p className="text-xs text-red-500">{form.formState.errors.clientType.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Sucursal *</Label>
                  <select
                    {...form.register("branch", { required: true })}
                    className={`w-full h-9 text-sm rounded-md border bg-white px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      form.formState.errors.branch ? "border-red-500" : "border-slate-200"
                    }`}
                  >
                    <option value="">Seleccione sucursal</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Fecha de Compra *</Label>
                  <Input
                    type="date"
                    {...form.register("purchaseDate")}
                    className={`h-9 text-sm ${form.formState.errors.purchaseDate ? "border-red-500" : ""}`}
                  />
                </div>
                {showFiscalFields && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Comprobante fiscal *</Label>
                      <Input
                        placeholder="B01..."
                        className={`h-9 text-sm ${form.formState.errors.taxCredit ? "border-red-500" : ""}`}
                        {...form.register("taxCredit")}
                      />
                      {form.formState.errors.taxCredit && (
                        <p className="text-xs text-red-500">{form.formState.errors.taxCredit.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">RNC *</Label>
                      <Input
                        placeholder="Ej. 130... o 101..."
                        className={`h-9 text-sm ${form.formState.errors.rnc ? "border-red-500" : ""}`}
                        {...form.register("rnc")}
                      />
                      {form.formState.errors.rnc && (
                        <p className="text-xs text-red-500">{form.formState.errors.rnc.message}</p>
                      )}
                    </div>
                  </>
                )}
                <div className={`space-y-1.5 ${!showFiscalFields ? "sm:col-span-2" : ""}`}>
                  <Label className="text-sm">Teléfono de Contacto *</Label>
                  <Input
                    placeholder="Ej. 809-123-4567"
                    className={`h-9 text-sm ${form.formState.errors.phone ? "border-red-500" : ""}`}
                    {...form.register("phone")}
                  />
                </div>
              </div>
            </div>

            {/* Información del Producto */}
            <div>
              <h3 className="text-base font-semibold border-b pb-1 mb-2">Información del Equipo</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Tipo de Producto *</Label>
                  <select
                    {...form.register("product", { required: true })}
                    className={`w-full h-9 text-sm rounded-md border bg-white px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      form.formState.errors.product ? "border-red-500" : "border-slate-200"
                    }`}
                  >
                    <option value="">Seleccione equipo</option>
                    {PRODUCTS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Número de Serie *</Label>
                  <Input
                    placeholder="S/N del equipo"
                    className={`h-9 text-sm ${form.formState.errors.serialNumber ? "border-red-500" : ""}`}
                    {...form.register("serialNumber")}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-sm">Descripción del Problema *</Label>
                  <Textarea
                    placeholder="Por favor, describe detalladamente la falla o problema que presenta el equipo..."
                    className={`min-h-[88px] resize-none text-sm py-2 ${form.formState.errors.description ? "border-red-500" : ""}`}
                    {...form.register("description")}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-sm">Adjuntar archivos (Opcional)</Label>
                  <p className="text-xs text-slate-500 mb-1.5">
                    Imágenes, PDF, documentos (Word, etc.). Múltiples archivos permitidos.
                  </p>
                  <div className="flex flex-col items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-4">
                        <Ticket className="w-6 h-6 mb-1.5 text-slate-400" />
                        <p className="text-xs text-slate-500 font-medium text-center px-3">
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
                      <p className="text-xs text-slate-600 mt-1.5">
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
              <p className="text-red-500 text-sm text-right">{submitError}</p>
            )}
            {Object.keys(form.formState.errors).length > 0 && (
              <p className="text-red-500 text-sm text-right">Por favor, completa todos los campos requeridos (*).</p>
            )}
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}

