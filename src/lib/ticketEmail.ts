/**
 * Envío de confirmación al cliente vía EmailJS (REST desde el navegador).
 *
 * Variables que envía esta app en `template_params` (úsalas en la plantilla EmailJS):
 * - `to_email` → destinatario (correo del formulario)
 * - `subject` → ej. "Nuevo Ticket Creado - TKT-..."
 * - `ticket_id` → número de ticket
 * - `status` → ej. "Pendiente"
 * - `description` → descripción (recortada si es muy larga)
 * - `message` → cuerpo en texto plano ya armado (Hola, estado, descripción, cierre)
 *
 * Plantilla mínima en EmailJS:
 * - To Email: {{to_email}}
 * - Subject: {{subject}}
 * - Content: {{message}}
 *
 * Copia `.env.example` a `.env` o `.env.local` y define VITE_EMAILJS_* (ver comentarios ahí).
 */
type TicketEmailPayload = {
  toEmail: string;
  ticketNumber: string;
  status: string;
  description: string;
  branch?: string;
  product?: string;
  serialNumber?: string;
  supportComment?: string;
};

export type TicketEmailResult =
  | { sent: true }
  | { sent: false; reason: "missing_config" | "missing_email" | "request_failed" };

function getEnvVar(name: string): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return (env?.[name] ?? "").trim();
}

function getSafeDescription(input: string): string {
  const text = (input || "").trim();
  if (!text) return "Sin detalles adicionales.";
  return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}

function getSafeValue(input: string | undefined, fallback = "No especificado."): string {
  const text = (input || "").trim();
  return text || fallback;
}

async function sendTicketEmail(
  payload: TicketEmailPayload,
  kind: "created" | "status_updated"
): Promise<TicketEmailResult> {
  const toEmail = payload.toEmail.trim();
  if (!toEmail) return { sent: false, reason: "missing_email" };

  const serviceId = getEnvVar("VITE_EMAILJS_SERVICE_ID");
  const templateId = getEnvVar("VITE_EMAILJS_TEMPLATE_ID");
  const publicKey = getEnvVar("VITE_EMAILJS_PUBLIC_KEY");

  if (!serviceId || !templateId || !publicKey) {
    return { sent: false, reason: "missing_config" };
  }

  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: toEmail,
      subject:
        kind === "created"
          ? `Nuevo Ticket Creado - ${payload.ticketNumber}`
          : `Actualizacion de Ticket - ${payload.ticketNumber}`,
      ticket_id: payload.ticketNumber,
      status: payload.status,
      description: getSafeDescription(payload.description),
      branch: getSafeValue(payload.branch),
      product: getSafeValue(payload.product),
      serial_number: getSafeValue(payload.serialNumber),
      support_comment: getSafeValue(payload.supportComment, "Sin comentario de soporte."),
      message: [
        "Hola,",
        kind === "created"
          ? "Tu ticket ha sido registrado correctamente."
          : "Tu ticket ha sido actualizado por el equipo de soporte.",
        "",
        `Ticket: ${payload.ticketNumber}`,
        `Estado: ${payload.status}`,
        `Sucursal: ${getSafeValue(payload.branch)}`,
        `Producto: ${getSafeValue(payload.product)}`,
        `Numero de serie: ${getSafeValue(payload.serialNumber)}`,
        `Descripcion: ${getSafeDescription(payload.description)}`,
        `Comentario de soporte: ${getSafeValue(payload.supportComment, "Sin comentario de soporte.")}`,
        "",
        "Te estaremos contactando pronto.",
      ].join("\n"),
    },
  };

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { sent: false, reason: "request_failed" };
    }

    return { sent: true };
  } catch {
    return { sent: false, reason: "request_failed" };
  }
}

export async function sendTicketCreatedEmail(payload: TicketEmailPayload): Promise<TicketEmailResult> {
  return sendTicketEmail(payload, "created");
}

export async function sendTicketStatusUpdatedEmail(payload: TicketEmailPayload): Promise<TicketEmailResult> {
  return sendTicketEmail(payload, "status_updated");
}
