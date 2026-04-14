import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginInputSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const clientTypeSchema = z.enum(["empresa", "negocio", "individual"], {
  message: "Indica si la compra es como empresa, negocio o persona individual",
});

export const ticketInputSchema = z
  .object({
    status: z.string().default("Pendiente"),
    clientType: clientTypeSchema,
    branch: z.string().min(1, "La sucursal es requerida"),
    purchaseDate: z.string().min(1, "La fecha de compra es requerida"),
    phone: z.string().min(1, "El teléfono es requerido"),
    email: z.string().min(1, "El correo electrónico es requerido").email("Introduce un correo válido"),
    product: z.string().min(1, "El producto es requerido"),
    serialNumber: z.string().min(1, "El número de serie es requerido"),
    description: z.string().min(1, "La descripción es requerida"),
    taxCredit: z.string().optional(),
    rnc: z.string().optional(),
    fileUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.clientType === "empresa" || data.clientType === "negocio") {
      if (!data.taxCredit?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El comprobante fiscal es obligatorio para empresa o negocio",
          path: ["taxCredit"],
        });
      }
      if (!data.rnc?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El RNC es obligatorio para empresa o negocio",
          path: ["rnc"],
        });
      }
    }
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