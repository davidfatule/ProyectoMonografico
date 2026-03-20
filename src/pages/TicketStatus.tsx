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
  if (isFuture) return "bg-slate-200 text-slate-400";
  if (stepIndex === 0) return "bg-red-500 text-white ring-2 ring-red-500/30";
  if (stepIndex === 1) return "bg-blue-500 text-white ring-2 ring-blue-500/30";
  return "bg-emerald-500 text-white ring-2 ring-emerald-500/30";
}

function getStepLabelClass(stepIndex: number, currentStep: number): string {
  const isFuture = stepIndex > currentStep;
  const isCurrent = stepIndex === currentStep;
  if (isFuture) return "text-slate-400";
  if (stepIndex === 0) {
    return isCurrent ? "text-red-600 font-semibold" : "text-red-700 font-medium";
  }
  if (stepIndex === 1) {
    return isCurrent ? "text-blue-600 font-semibold" : "text-blue-700 font-medium";
  }
  return isCurrent ? "text-emerald-600 font-semibold" : "text-emerald-700 font-medium";
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
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !ticket) {
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Ticket no encontrado</h2>
          <p className="text-slate-500 mb-8">El número de ticket "{ticketNumber}" no existe o es incorrecto.</p>
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

  const cardClass = "bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-slate-100/80";

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Estado de Solicitud */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Estado de Solicitud</h2>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3 flex-wrap">
              {ticket.ticketNumber}
              {isRejected && <Badge variant="destructive" className="text-sm">Rechazado</Badge>}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Fecha de creación</p>
            <p className="font-medium text-slate-800">{ticket.createdAt ? format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: es }) : '-'}</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className={cardClass + " mb-8"}>
          {!isRejected ? (
            <div className="relative flex justify-between items-center max-w-2xl mx-auto">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10 rounded-full" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 -z-10 rounded-full transition-all duration-500 bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500"
                style={{ width: `${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
              {STATUS_STEPS.map((step, idx) => {
                const isReached = idx <= currentStep;
                return (
                  <div key={step} className="flex flex-col items-center bg-white px-2 py-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${getStepCircleClass(idx, currentStep)}`}
                    >
                      {isReached ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-3 h-3 fill-current" />}
                    </div>
                    <span className={`mt-2 text-sm ${getStepLabelClass(idx, currentStep)}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-base text-destructive font-medium">Este ticket ha sido rechazado tras la evaluación.</p>
            </div>
          )}
        </div>

        {supportComment && (
          <div className={cardClass + " mb-8"}>
            <h3 className="font-semibold text-lg text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Comentario del Soporte
            </h3>
            <p className="bg-slate-50/80 p-4 rounded-xl text-slate-700 leading-relaxed text-sm border border-slate-100">
              {supportComment}
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className={cardClass}>
              <h3 className="font-semibold text-lg text-slate-900 border-b border-slate-100 pb-3 mb-4">Detalles del Equipo</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-sm text-slate-500">Producto</p>
                  <p className="font-medium text-slate-800">{ticket.product}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Número de Serie</p>
                  <p className="font-medium text-slate-800 font-mono text-sm">{ticket.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Fecha Compra</p>
                  <p className="font-medium text-slate-800">{ticket.purchaseDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Sucursal</p>
                  <p className="font-medium text-slate-800">{ticket.branch}</p>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-sm text-slate-500 mb-1">Descripción del problema</p>
                  <p className="bg-slate-50/80 p-4 rounded-xl text-slate-700 leading-relaxed text-sm border border-slate-100">
                    {ticket.description}
                  </p>
                </div>
              </div>
            </div>

            {ticket.status === "Resuelto" && (
              <div className={`${cardClass} bg-gradient-to-br from-white to-blue-50/30 border-blue-100`}>
                <h3 className="font-semibold text-lg text-blue-900 mb-2">Evaluación del Servicio</h3>
                {ticket.evaluation ? (
                  <div className="bg-white p-6 rounded-xl border border-blue-50 shadow-sm mt-4">
                    <p className="text-sm font-medium text-slate-500 mb-3">Tu calificación:</p>
                    <StarRating rating={ticket.evaluation.rating} readOnly />
                    {ticket.evaluation.comment && (
                      <p className="mt-4 text-slate-700 italic">"{ticket.evaluation.comment}"</p>
                    )}
                    <p className="mt-4 text-sm text-emerald-600 font-medium flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Gracias por ayudarnos a mejorar
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-slate-600 mb-6">Tu ticket ha sido resuelto. ¿Qué te pareció nuestro servicio?</p>
                    <div className="space-y-6">
                      <div className="flex justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                        <StarRating rating={rating} onRatingChange={setRating} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Comentarios (Opcional)</label>
                        <Textarea
                          placeholder="Cuéntanos más sobre tu experiencia..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="resize-none"
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
              <h3 className="font-semibold text-lg text-slate-900 border-b border-slate-100 pb-3 mb-4">Atención</h3>
              {ticket.assignee ? (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Técnico Asignado</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0">
                      {ticket.assignee.username.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{ticket.assignee.username}</p>
                      <p className="text-xs text-slate-500">Soporte Técnico</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic text-center py-4">Esperando asignación de técnico...</p>
              )}
            </div>

            <div className={cardClass}>
              <h3 className="font-semibold text-lg text-slate-900 border-b border-slate-100 pb-3 mb-4">Contacto</h3>
              <p className="text-sm text-slate-500 mb-1">Teléfono registrado</p>
              <p className="font-medium text-slate-800">{ticket.phone}</p>
              {ticket.rnc && (
                <>
                  <p className="text-sm text-slate-500 mt-4 mb-1">RNC</p>
                  <p className="font-medium text-slate-800">{ticket.rnc}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

