import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginInputSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const ticketInputSchema = z.object({
  status: z.string().default("Pendiente"),
  branch: z.string().min(1, "La sucursal es requerida"),
  purchaseDate: z.string().min(1, "La fecha de compra es requerida"),
  phone: z.string().min(1, "El teléfono es requerido"),
  product: z.string().min(1, "El producto es requerido"),
  serialNumber: z.string().min(1, "El número de serie es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  taxCredit: z.string().optional(),
  rnc: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const ticketOutputSchema = z.object({
  ticketNumber: z.string(),
  id: z.number(),
});

export const evaluationSchema = z.object({
  ticketId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const api = {
  auth: {
    login: {
      input: loginInputSchema,
    },
  },
  tickets: {
    create: {
      input: ticketInputSchema,
      output: ticketOutputSchema,
    },
  },
} as const;