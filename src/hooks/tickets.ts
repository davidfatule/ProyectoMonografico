import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFirstTechnicianUsername } from "@/lib/mockAuth";
import { getNextTechnicianAssigneeUsername } from "@/lib/technicianPresence";
import { getMockTicketByNumber } from "@/lib/mockTickets";
import {
  getCachedTickets,
  getCachedTicketByNumber,
  upsertCachedTicket,
  type CachedTicket,
} from "@/lib/indexedDb";

function getTicketNumberFromObject(value: Record<string, unknown>): string | null {
  if (typeof value.ticketNumber === "string" && value.ticketNumber.length > 0) return value.ticketNumber;
  if (typeof value.ticket_number === "string" && value.ticket_number.length > 0) return value.ticket_number;
  return null;
}

type LocalTicket = {
  id: number;
  ticketNumber: string;
  status: string;
  clientType?: "empresa" | "negocio" | "individual";
  branch: string;
  purchaseDate: string;
  phone: string;
  email: string;
  product: string;
  serialNumber: string;
  description: string;
  taxCredit?: string;
  rnc?: string;
  fileUrl?: string;
  createdAt: string;
  assignee?: { username: string } | null;
  evaluation?: { rating: number; comment?: string } | null;
  supportComment?: string;
};

function toLocalTicket(ticket: CachedTicket): LocalTicket {
  const id = typeof ticket.id === "number" ? ticket.id : Date.now();
  const ticketNumber = getTicketNumberFromObject(ticket) ?? `TKT-${Date.now()}`;
  const createdAt =
    typeof ticket.createdAt === "string"
      ? ticket.createdAt
      : typeof ticket.created_at === "string"
        ? ticket.created_at
        : new Date().toISOString();

  const rawClientType = ticket.clientType;
  const clientType =
    rawClientType === "empresa" || rawClientType === "negocio" || rawClientType === "individual"
      ? rawClientType
      : undefined;

  return {
    id,
    ticketNumber,
    status: typeof ticket.status === "string" ? ticket.status : "Pendiente",
    clientType,
    branch: typeof ticket.branch === "string" ? ticket.branch : "",
    purchaseDate:
      typeof ticket.purchaseDate === "string"
        ? ticket.purchaseDate
        : typeof ticket.purchase_date === "string"
          ? ticket.purchase_date
          : "",
    phone: typeof ticket.phone === "string" ? ticket.phone : "",
    email: typeof ticket.email === "string" ? ticket.email : "",
    product: typeof ticket.product === "string" ? ticket.product : "",
    serialNumber:
      typeof ticket.serialNumber === "string"
        ? ticket.serialNumber
        : typeof ticket.serial_number === "string"
          ? ticket.serial_number
          : "",
    description: typeof ticket.description === "string" ? ticket.description : "",
    taxCredit: typeof ticket.taxCredit === "string" ? ticket.taxCredit : undefined,
    rnc: typeof ticket.rnc === "string" ? ticket.rnc : undefined,
    fileUrl: typeof ticket.fileUrl === "string" ? ticket.fileUrl : undefined,
    createdAt,
    assignee:
      ticket.assignee && typeof ticket.assignee === "object"
        ? (ticket.assignee as { username: string })
        : { username: getFirstTechnicianUsername() },
    evaluation:
      ticket.evaluation && typeof ticket.evaluation === "object"
        ? (ticket.evaluation as { rating: number; comment?: string })
        : null,
    supportComment: typeof ticket.supportComment === "string" ? ticket.supportComment : undefined,
  };
}

function toDashboardRow(ticket: LocalTicket) {
  return {
    id: ticket.id,
    ticket_number: ticket.ticketNumber,
    status: ticket.status,
    branch: ticket.branch,
    product: ticket.product,
    serial_number: ticket.serialNumber,
    description: ticket.description,
    created_at: ticket.createdAt,
    assignee_username: ticket.assignee?.username ?? null,
    support_comment: ticket.supportComment ?? null,
    client_type: ticket.clientType ?? null,
    rnc: ticket.rnc ?? null,
  };
}

/** Más reciente primero (orden de llegada). */
function sortTicketsNewestFirst<T extends { created_at: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });
}

function generateTicketNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${date}-${random}`;
}

export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const cached = await getCachedTickets();
      return sortTicketsNewestFirst(cached.map((ticket) => toDashboardRow(toLocalTicket(ticket))));
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
}

export function useSyncTicketsNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const cached = await getCachedTickets();
      return sortTicketsNewestFirst(cached.map((ticket) => toDashboardRow(toLocalTicket(ticket))));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["tickets"], data);
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const cached = await getCachedTickets();
      const localTickets = cached.map(toLocalTicket);
      const nextId = localTickets.length > 0 ? Math.max(...localTickets.map((t) => t.id)) + 1 : 1;
      const ticketNumber = generateTicketNumber();
      const createdAt = new Date().toISOString();

      const clientTypeRaw = data.clientType;
      const clientType =
        clientTypeRaw === "empresa" || clientTypeRaw === "negocio" || clientTypeRaw === "individual"
          ? clientTypeRaw
          : undefined;
      const isIndividual = clientType === "individual";

      const localTicket: LocalTicket = {
        id: nextId,
        ticketNumber,
        status: typeof data.status === "string" ? data.status : "Pendiente",
        clientType,
        branch: typeof data.branch === "string" ? data.branch : "",
        purchaseDate: typeof data.purchaseDate === "string" ? data.purchaseDate : "",
        phone: typeof data.phone === "string" ? data.phone : "",
        email: typeof data.email === "string" ? data.email.trim() : "",
        product: typeof data.product === "string" ? data.product : "",
        serialNumber: typeof data.serialNumber === "string" ? data.serialNumber : "",
        description: typeof data.description === "string" ? data.description : "",
        taxCredit: isIndividual
          ? undefined
          : typeof data.taxCredit === "string"
            ? data.taxCredit.trim() || undefined
            : undefined,
        rnc: isIndividual ? undefined : typeof data.rnc === "string" ? data.rnc.trim() || undefined : undefined,
        fileUrl: typeof data.fileUrl === "string" ? data.fileUrl : undefined,
        createdAt,
        assignee: { username: getNextTechnicianAssigneeUsername() },
        evaluation: null,
        supportComment: undefined,
      };

      await upsertCachedTicket(localTicket as unknown as CachedTicket);
      return { ticketNumber, id: nextId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketNumber,
      status,
      comment,
    }: {
      ticketNumber: string;
      status: string;
      comment?: string;
    }) => {
      const cachedTicket = await getCachedTicketByNumber(ticketNumber);
      if (!cachedTicket) throw new Error("Ticket no encontrado");
      const local = toLocalTicket(cachedTicket);
      await upsertCachedTicket({
        ...local,
        status,
        supportComment: comment !== undefined ? comment : local.supportComment,
      } as unknown as CachedTicket);
      return { ticket_number: ticketNumber, status, supportComment: comment };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      // Si el cliente tiene abierta la vista pública, que se actualice al instante.
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.ticketNumber] });
    },
  });
}

export function useTicketByNumber(ticketNumber: string) {
  return useQuery({
    queryKey: ["ticket", ticketNumber],
    queryFn: async () => {
      const cached = await getCachedTicketByNumber(ticketNumber);
      if (cached) return toLocalTicket(cached);

      // Compatibilidad con datos legacy guardados en localStorage.
      const mock = getMockTicketByNumber(ticketNumber);
      if (mock) return mock;
      throw new Error("Error al obtener el ticket");
    },
    enabled: !!ticketNumber,
  });
}

export type TicketUpdatePayload = Partial<
  Pick<
    LocalTicket,
    | "status"
    | "branch"
    | "purchaseDate"
    | "phone"
    | "email"
    | "product"
    | "serialNumber"
    | "description"
    | "taxCredit"
    | "rnc"
    | "supportComment"
    | "assignee"
  >
>;

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketNumber,
      patch,
    }: {
      ticketNumber: string;
      patch: TicketUpdatePayload;
    }) => {
      const cachedTicket = await getCachedTicketByNumber(ticketNumber);
      if (!cachedTicket) throw new Error("Ticket no encontrado");
      const local = toLocalTicket(cachedTicket);
      await upsertCachedTicket({
        ...local,
        ...patch,
      } as unknown as CachedTicket);
    },
    onSuccess: (_data, { ticketNumber }) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketNumber] });
    },
  });
}
