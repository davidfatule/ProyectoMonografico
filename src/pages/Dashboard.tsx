import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

import { DashboardLayout } from "@/Layouts/DashboardLayout";
import { AdminDashboard } from "@/components/AdminDashboard";
import { TechnicianDashboard } from "@/components/TechnicianDashboard";
import { useUser } from "@/hooks/auth";

export default function Dashboard() {
  const { data: user, isLoading, error } = useUser();
  const [, setLocation] = useLocation();

  // Redirige al login si no hay usuario
  useEffect(() => {
    if (!isLoading && (!user || error)) {
      setLocation("/login");
    }
  }, [user, isLoading, error, setLocation]);

  // Pantalla de carga
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Renderiza el dashboard según el rol
  return (
    <DashboardLayout>
      {user.role === "admin" ? (
        <AdminDashboard />
      ) : user.role === "technician" ? (
        <TechnicianDashboard />
      ) : (
        <p>Rol no reconocido</p>
      )}
    </DashboardLayout>
  );
}

