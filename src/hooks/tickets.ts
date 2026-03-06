import { useQuery, useMutation } from "@tanstack/react-query";
import { createMockTicket, getMockTicketByNumber } from "@/lib/mockTickets";

export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await fetch("/api/tickets");
      return res.json();
    },
  });
}

export function useCreateTicket() {
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        const res = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) return res.json();
      } catch {
        // Sin backend: continuar con mock
      }
      // Sin BD: guardar en localStorage y devolver número de ticket
      const { ticketNumber, id } = createMockTicket({
        status: data.status ?? "Pendiente",
        branch: data.branch ?? "",
        purchaseDate: data.purchaseDate ?? "",
        phone: data.phone ?? "",
        product: data.product ?? "",
        serialNumber: data.serialNumber ?? "",
        description: data.description ?? "",
        taxCredit: data.taxCredit,
        rnc: data.rnc,
        fileUrl: data.fileUrl,
      });
      return { ticketNumber, id };
    },
  });
}

export function useTicketByNumber(ticketNumber: string) {
  return useQuery({
    queryKey: ["ticket", ticketNumber],
    queryFn: async () => {
      // Primero intentar mock (localStorage) para evitar esperar a la API y mostrar contenido al instante
      const mock = getMockTicketByNumber(ticketNumber);
      if (mock) return mock;
      try {
        const res = await fetch(`/api/tickets/${ticketNumber}`);
        if (res.ok) return res.json();
      } catch {
        // Sin backend
      }
      throw new Error("Error al obtener el ticket");
    },
    enabled: !!ticketNumber,
  });
}
