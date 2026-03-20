import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCachedTickets, upsertCachedTicket, type CachedTicket } from "@/lib/indexedDb";

export function useEvaluations() {
  return useQuery({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const tickets = await getCachedTickets();
      return tickets
        .filter((ticket) => ticket.evaluation != null)
        .map((ticket) => {
          const evaluation = ticket.evaluation as { rating: number; comment?: string };
          return {
            ticketId: ticket.id,
            rating: evaluation.rating,
            comment: evaluation.comment,
          };
        });
    },
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ticketId: number; rating: number; comment?: string }) => {
      const tickets = await getCachedTickets();
      const target = tickets.find((ticket) => ticket.id === data.ticketId);
      if (!target) throw new Error("Ticket no encontrado para evaluar.");

      const updated: CachedTicket = {
        ...target,
        evaluation: { rating: data.rating, comment: data.comment },
      };
      await upsertCachedTicket(updated);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      // Actualiza la vista pública del ticket si está abierta.
      queryClient.invalidateQueries({ queryKey: ["ticket"] });
    },
  });
}