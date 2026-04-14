/**
 * Tickets temporales sin BD (localStorage).
 * Cuando tengas backend, quitarás esto y usarás solo la API.
 */

const STORAGE_KEY = "soportepro_tickets";

export interface MockTicket {
  id: number;
  ticketNumber: string;
  status: string;
  createdAt: string;
  branch: string;
  purchaseDate: string;
  phone: string;
  email?: string;
  product: string;
  serialNumber: string;
  description: string;
  taxCredit?: string;
  rnc?: string;
  fileUrl?: string;
  evaluation?: { rating: number; comment?: string };
  assignee?: { username: string };
  supportComment?: string;
}

function getStoredTickets(): MockTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setStoredTickets(tickets: MockTicket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function generateTicketNumber(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TCK-${n}`;
}

export function createMockTicket(data: Omit<MockTicket, "id" | "ticketNumber" | "createdAt">): { ticketNumber: string; id: number } {
  const tickets = getStoredTickets();
  const id = tickets.length > 0 ? Math.max(...tickets.map((t) => t.id)) + 1 : 1;
  const ticketNumber = generateTicketNumber();
  const ticket: MockTicket = {
    ...data,
    id,
    ticketNumber,
    createdAt: new Date().toISOString(),
    assignee: { username: "David@Helpdesk.com" },
  };
  tickets.push(ticket);
  setStoredTickets(tickets);
  return { ticketNumber, id };
}

export function getMockTicketByNumber(ticketNumber: string): MockTicket | null {
  const tickets = getStoredTickets();
  return tickets.find((t) => t.ticketNumber === ticketNumber) ?? null;
}

/** Elimina tickets legacy en localStorage asignados al técnico antiguo (misma lógica que IndexedDB). */
export function purgeMockTicketsByLegacyAssigneeEmail(email: string): number {
  const target = (email || "").trim().toLowerCase();
  if (!target) return 0;
  const tickets = getStoredTickets();
  const kept = tickets.filter((t) => (t.assignee?.username || "").trim().toLowerCase() !== target);
  const removed = tickets.length - kept.length;
  if (removed > 0) setStoredTickets(kept);
  return removed;
}
