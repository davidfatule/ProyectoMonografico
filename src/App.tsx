import { useEffect } from "react";
import { Route, Switch } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { deleteCachedTicketsByAssigneeEmail } from "@/lib/indexedDb";
import { purgeMockTicketsByLegacyAssigneeEmail } from "@/lib/mockTickets";

// Componentes globales
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Páginas
import Home from "@/pages/Home";
import NewTicket from "@/pages/NewTicket";
import TicketStatus from "@/pages/TicketStatus";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Tickets from "@/pages/Tickets";
import NotFound from "@/pages/not-found";

const LEGACY_TECH_EMAIL = "tech@helpdesk.com";

/** Una vez al cargar: borra tickets asignados al usuario técnico eliminado. */
function LegacyTechTicketsPurge() {
  const queryClient = useQueryClient();
  useEffect(() => {
    void (async () => {
      const nDb = await deleteCachedTicketsByAssigneeEmail(LEGACY_TECH_EMAIL);
      const nLs = purgeMockTicketsByLegacyAssigneeEmail(LEGACY_TECH_EMAIL);
      if (nDb > 0 || nLs > 0) {
        await queryClient.invalidateQueries({ queryKey: ["tickets"] });
      }
    })();
  }, [queryClient]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new-ticket" component={NewTicket} />
      <Route path="/ticket/:ticketNumber/status" component={TicketStatus} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/tickets" component={Tickets} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LegacyTechTicketsPurge />
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}