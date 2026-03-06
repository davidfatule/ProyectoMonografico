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
  product: string;
  serialNumber: string;
  description: string;
  taxCredit?: string;
  rnc?: string;
  fileUrl?: string;
  evaluation?: { rating: number; comment?: string };
  assignee?: { username: string };
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
    assignee: { username: "Tech@Helpdesk.Com" },
  };
  tickets.push(ticket);
  setStoredTickets(tickets);
  return { ticketNumber, id };
}

export function getMockTicketByNumber(ticketNumber: string): MockTicket | null {
  const tickets = getStoredTickets();
  return tickets.find((t) => t.ticketNumber === ticketNumber) ?? null;
}
