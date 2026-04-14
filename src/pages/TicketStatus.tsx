import { useState } from "react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Circle, Search, ArrowLeft, Send } from "lucide-react";
import { PublicLayout } from "@/Layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/rating";
import { useTicketByNumber } from "@/hooks/tickets";
import { useCreateEvaluation } from "@/hooks/evaluations";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const STATUS_STEPS = ["Pendiente", "En Proceso", "Resuelto"] as const;

function getStepCircleClass(stepIndex: number, currentStep: number): string {
  const isFuture = stepIndex > currentStep;
  if (isFuture) return "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500";
  if (stepIndex === 0) return "bg-red-500 text-white ring-2 ring-red-500/30";
  if (stepIndex === 1) return "bg-blue-500 text-white ring-2 ring-blue-500/30";
  return "bg-emerald-500 text-white ring-2 ring-emerald-500/30";
}

function getStepLabelClass(stepIndex: number, currentStep: number): string {
  const isFuture = stepIndex > currentStep;
  const isCurrent = stepIndex === currentStep;
  if (isFuture) return "text-slate-400 dark:text-slate-500";
  if (stepIndex === 0) {
    return isCurrent
      ? "font-semibold text-red-600 dark:text-red-400"
      : "font-medium text-red-700 dark:text-red-400";
  }
  if (stepIndex === 1) {
    return isCurrent
      ? "font-semibold text-blue-600 dark:text-blue-400"
      : "font-medium text-blue-700 dark:text-blue-400";
  }
  return isCurrent
    ? "font-semibold text-emerald-600 dark:text-emerald-400"
    : "font-medium text-emerald-700 dark:text-emerald-400";
}

export default function TicketStatus() {
  const { ticketNumber } = useParams<{ ticketNumber: string }>();
  const { data: ticket, isLoading, error } = useTicketByNumber(ticketNumber || "");
  const createEvaluation = useCreateEvaluation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleEvaluate = () => {
    if (!ticket || rating === 0) return;
    createEvaluation.mutate({
      ticketId: ticket.id,
      rating,
      comment
    });
  };

  const getStatusIndex = (status: string) => {
    return (STATUS_STEPS as readonly string[]).indexOf(status);
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="w-full app-shell-wide max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !ticket) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Search className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Ticket no encontrado</h2>
          <p className="mb-8 text-slate-500 dark:text-slate-400">
            El número de ticket "{ticketNumber}" no existe o es incorrecto.
          </p>
          <Link href="/">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/> Volver al inicio</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const isRejected = ticket.status === "Rechazado";
  const currentStep = isRejected ? -1 : getStatusIndex(ticket.status);
  const supportComment = typeof ticket.supportComment === "string" ? ticket.supportComment : "";

  const cardClass =
    "rounded-2xl border border-slate-100/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]";
  const insetBoxClass =
    "rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200";
  const sectionHeadingClass =
    "mb-4 border-b border-slate-100 pb-3 text-lg font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-100";

  return (
    <PublicLayout>
      <div className="w-full app-shell-wide max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {/* Estado de Solicitud */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Estado de Solicitud
            </h2>
            <h1 className="flex flex-wrap items-center gap-3 break-words text-xl font-bold text-slate-900 xs:text-2xl sm:text-3xl 3xl:text-4xl dark:text-slate-100">
              {ticket.ticketNumber}
              {isRejected && <Badge variant="destructive" className="text-sm shrink-0">Rechazado</Badge>}
            </h1>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">Fecha de creación</p>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {ticket.createdAt ? format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: es }) : "-"}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className={cardClass + " mb-8"}>
          {!isRejected ? (
            <div className="mx-auto max-w-2xl px-2 py-2 sm:px-4">
              {/* Fila solo de círculos: la línea une los centros (no el medio del bloque con etiquetas) */}
              <div className="relative flex h-10 w-full items-center justify-between">
                {/* Pista base entre el centro del primer y último círculo (círculos w-10 → mitad = 1.25rem) */}
                <div
                  className="pointer-events-none absolute left-[1.25rem] right-[1.25rem] top-1/2 z-0 h-[3px] -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-600"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute left-[1.25rem] top-1/2 z-0 h-[3px] max-w-[calc(100%-2.5rem)] -translate-y-1/2 rounded-full bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500 transition-[width] duration-500 ease-out"
                  style={{
                    width: `calc((100% - 2.5rem) * ${Math.max(0, currentStep) / (STATUS_STEPS.length - 1)})`,
                  }}
                  aria-hidden
                />
                {STATUS_STEPS.map((step, idx) => {
                  const isReached = idx <= currentStep;
                  return (
                    <div
                      key={step}
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${getStepCircleClass(idx, currentStep)}`}
                    >
                      {isReached ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-3 w-3 fill-current" />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-between gap-1 sm:gap-2">
                {STATUS_STEPS.map((step, idx) => (
                  <span
                    key={`${step}-label`}
                    className={`min-w-0 flex-1 text-center text-xs leading-tight sm:text-sm ${getStepLabelClass(idx, currentStep)}`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-base font-medium text-destructive dark:text-red-400">
                Este ticket ha sido rechazado tras la evaluación.
              </p>
            </div>
          )}
        </div>

        {supportComment && (
          <div className={cardClass + " mb-8"}>
            <h3 className={sectionHeadingClass}>Comentario del Soporte</h3>
            <p className={insetBoxClass}>{supportComment}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className={cardClass}>
              <h3 className={sectionHeadingClass}>Detalles del Equipo</h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 xs:grid-cols-2 sm:gap-x-8">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Producto</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{ticket.product}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Número de Serie</p>
                  <p className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200">{ticket.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Fecha Compra</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{ticket.purchaseDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sucursal</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{ticket.branch}</p>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Descripción del problema</p>
                  <p className={insetBoxClass}>{ticket.description}</p>
                </div>
              </div>
            </div>

            {ticket.status === "Resuelto" && (
              <div
                className={`${cardClass} border-blue-100 bg-gradient-to-br from-white to-blue-50/30 dark:border-blue-900/40 dark:from-slate-900 dark:to-blue-950/35`}
              >
                <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-200">Evaluación del Servicio</h3>
                {ticket.evaluation ? (
                  <div className="mt-4 rounded-xl border border-blue-50 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                    <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Tu calificación:</p>
                    <StarRating rating={ticket.evaluation.rating} readOnly />
                    {ticket.evaluation.comment && (
                      <p className="mt-4 italic text-slate-700 dark:text-slate-300">"{ticket.evaluation.comment}"</p>
                    )}
                    <p className="mt-4 flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Gracias por ayudarnos a mejorar
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="mb-6 text-slate-600 dark:text-slate-300">
                      Tu ticket ha sido resuelto. ¿Qué te pareció nuestro servicio?
                    </p>
                    <div className="space-y-6">
                      <div className="flex justify-center rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                        <StarRating rating={rating} onRatingChange={setRating} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Comentarios (Opcional)
                        </label>
                        <Textarea
                          placeholder="Cuéntanos más sobre tu experiencia..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                      </div>
                      <Button
                        className="w-full"
                        disabled={rating === 0 || createEvaluation.isPending}
                        onClick={handleEvaluate}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {createEvaluation.isPending ? "Enviando..." : "Enviar Evaluación"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className={cardClass}>
              <h3 className={sectionHeadingClass}>Atención</h3>
              {ticket.assignee ? (
                <div>
                  <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">Técnico Asignado</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold uppercase text-primary dark:bg-primary/20">
                      {ticket.assignee.username.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{ticket.assignee.username}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Soporte Técnico</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm italic text-slate-500 dark:text-slate-400">
                  Esperando asignación de técnico...
                </p>
              )}
            </div>

            <div className={cardClass}>
              <h3 className={sectionHeadingClass}>Contacto</h3>
              <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Teléfono registrado</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{ticket.phone}</p>
              {ticket.email?.trim() ? (
                <>
                  <p className="mb-1 mt-4 text-sm text-slate-500 dark:text-slate-400">Correo electrónico</p>
                  <p className="break-all font-medium text-slate-800 dark:text-slate-200">{ticket.email}</p>
                </>
              ) : null}
              {ticket.rnc && (
                <>
                  <p className="mb-1 mt-4 text-sm text-slate-500 dark:text-slate-400">RNC</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{ticket.rnc}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

