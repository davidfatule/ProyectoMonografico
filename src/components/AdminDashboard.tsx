import { useMemo, useState } from "react";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Users, Ticket, Star, Clock, Loader2, PencilLine, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTickets } from "@/hooks/tickets";
import { useEvaluations } from "@/hooks/evaluations";
import { useUsers, useCreateTechnician, useUpdateUserActive } from "@/hooks/user";

type UserFormState = {
  username: string;
  name: string;
  password: string;
  role: "admin" | "technician";
  active: boolean;
};

const emptyUserForm: UserFormState = {
  username: "",
  name: "",
  password: "",
  role: "technician",
  active: true,
};

function avgRating(evaluations: { rating: number }[]) {
  if (evaluations.length === 0) return 0;
  const sum = evaluations.reduce((acc, e) => acc + e.rating, 0);
  return sum / evaluations.length;
}

export function AdminDashboard() {
  const { data: tickets, isLoading: isTicketsLoading } = useTickets();
  const { data: evaluations } = useEvaluations();
  const { data: users, isLoading: isUsersLoading } = useUsers();

  const createTechnician = useCreateTechnician();
  const updateUserActive = useUpdateUserActive();

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);

  const [userFormError, setUserFormError] = useState("");

  const openedTodayCount = useMemo(() => {
    if (!tickets) return 0;
    const now = new Date();
    return tickets.filter((t) => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      if (Number.isNaN(d.getTime())) return false;
      return isWithinInterval(d, { start: startOfDay(now), end: endOfDay(now) });
    }).length;
  }, [tickets]);

  const activeTechniciansCount = useMemo(() => {
    if (!users) return 0;
    return users.filter((u) => u.role === "technician" && u.active).length;
  }, [users]);

  const avg = avgRating(evaluations ?? []);

  const totalTickets = tickets?.length ?? 0;

  const openCreateModal = () => {
    setEditingUsername(null);
    setUserForm({ ...emptyUserForm, role: "technician", active: true });
    setUserModalOpen(true);
  };

  const openEditModal = (u: { username: string; role: "admin" | "technician"; active: boolean; name: string }) => {
    setEditingUsername(u.username);
    setUserForm({
      username: u.username,
      name: u.name,
      password: "",
      role: u.role,
      active: u.active,
    });
    setUserModalOpen(true);
  };

  const submitUser = () => {
    setUserFormError("");

    if (!userForm.username.trim()) {
      setUserFormError("El usuario (email) es obligatorio.");
      return;
    }
    if (!userForm.name.trim()) {
      setUserFormError("El nombre es obligatorio.");
      return;
    }

    if (!editingUsername) {
      if (!userForm.password.trim()) {
        setUserFormError("La contraseña es obligatoria para crear un usuario.");
        return;
      }

      createTechnician.mutate(
        {
          username: userForm.username.trim(),
          password: userForm.password.trim(),
          name: userForm.name.trim(),
        },
        {
          onSuccess: () => setUserModalOpen(false),
          onError: (err) => setUserFormError(err instanceof Error ? err.message : "No se pudo crear el usuario."),
        }
      );
      return;
    }

    updateUserActive.mutate(
      {
        username: editingUsername,
        active: userForm.active,
        role: userForm.role,
      },
      {
        onSuccess: () => setUserModalOpen(false),
        onError: (err) => setUserFormError(err instanceof Error ? err.message : "No se pudo actualizar el usuario."),
      }
    );
  };

  if (isTicketsLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Panel de Administración</h2>
      <p className="text-slate-600 mb-6">Gestión de personal, métricas y satisfacción del servicio.</p>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-white rounded-xl shadow border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalTickets}</p>
                <p className="text-sm text-slate-500">Total Tickets</p>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white rounded-xl shadow border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeTechniciansCount}</p>
                <p className="text-sm text-slate-500">Técnicos Activos</p>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white rounded-xl shadow border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{avg.toFixed(1)}/5</p>
                <p className="text-sm text-slate-500">Satisfacción</p>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white rounded-xl shadow border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{openedTodayCount}</p>
                <p className="text-sm text-slate-500">Tickets Abiertos Hoy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gestión de Personal */}
        <div className="p-6 bg-white rounded-xl shadow border border-slate-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold text-lg">Gestión de Personal</h3>
              <p className="text-sm text-slate-500">Usuarios del sistema (admin y soporte).</p>
            </div>
            <Button
              type="button"
              onClick={openCreateModal}
              size="sm"
              className="inline-flex items-center gap-2"
              disabled={createTechnician.isPending}
            >
              <Plus className="w-4 h-4" />
              Nuevo Técnico
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Usuario</th>
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <tr key={u.username} className="border-b border-slate-100 last:border-0">
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{u.username}</div>
                      <div className="text-xs text-slate-500">{u.name}</div>
                    </td>
                    <td className="py-3">
                      <span className="text-slate-700">{u.role}</span>
                    </td>
                    <td className="py-3">
                      <Badge variant={u.active ? "success" : "destructive"} color="primary" className="bg-opacity-70">
                        {u.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <PencilLine className="w-4 h-4" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {(users ?? []).length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={4}>
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog
          open={userModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUsername(null);
              setUserForm(emptyUserForm);
              setUserFormError("");
            }
            setUserModalOpen(open);
          }}
        >
          <DialogContent className="w-[92vw] max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingUsername ? "Editar usuario" : "Nuevo técnico"}</DialogTitle>
              <DialogDescription>
                {editingUsername
                  ? "Actualiza el rol y el estado. (La contraseña no se modifica aquí.)"
                  : "Crea un usuario nuevo para que pueda iniciar sesión como soporte."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm">Usuario (email)</Label>
                <Input
                  value={userForm.username}
                  onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                  disabled={!!editingUsername}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Nombre</Label>
                <Input
                  value={userForm.name}
                  onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              {!editingUsername && (
                <div className="space-y-1">
                  <Label className="text-sm">Contraseña</Label>
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Rol</Label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value as "admin" | "technician" }))}
                    className="w-full h-9 text-sm rounded-md border border-slate-200 bg-white px-2.5"
                  >
                    <option value="admin">admin</option>
                    <option value="technician">technician</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Estado</Label>
                  <select
                    value={userForm.active ? "active" : "inactive"}
                    onChange={(e) => setUserForm((f) => ({ ...f, active: e.target.value === "active" }))}
                    className="w-full h-9 text-sm rounded-md border border-slate-200 bg-white px-2.5"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              {userFormError && <p className="text-sm text-red-500">{userFormError}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)} disabled={createTechnician.isPending || updateUserActive.isPending}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={submitUser}
                disabled={createTechnician.isPending || updateUserActive.isPending}
              >
                {editingUsername ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}