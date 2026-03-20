import { useQuery } from "@tanstack/react-query";
import { getCachedTickets } from "@/lib/indexedDb";

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const tickets = await getCachedTickets();
      const total = tickets.length;
      const pendientes = tickets.filter((t) => t.status === "Pendiente").length;
      const enProceso = tickets.filter((t) => t.status === "En Proceso").length;
      const resueltos = tickets.filter((t) => t.status === "Resuelto").length;
      return { total, pendientes, enProceso, resueltos };
    },
  });
}