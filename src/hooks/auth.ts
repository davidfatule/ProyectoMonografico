import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  checkTempCredentials,
  type MockUser,
} from "@/lib/mockAuth";
import {
  getCachedSessionUser,
  setCachedSessionUser,
  clearCachedSessionUser,
} from "@/lib/indexedDb";
import { getCachedUserAccountByUsername } from "@/lib/indexedDb";
import { removeTechnicianPresence, touchTechnicianPresence } from "@/lib/technicianPresence";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const tabUser = getStoredUser();
      if (tabUser) return tabUser;

      const cachedSessionUser = await getCachedSessionUser();
      if (cachedSessionUser) {
        setStoredUser(cachedSessionUser);
        return cachedSessionUser;
      }

      throw new Error("No autenticado");
    },
    retry: false,
  });
}

/** Heartbeat para que la asignación automática de tickets vea a los técnicos con sesión activa (incluye varias pestañas). */
export function useTechnicianPresence(user: MockUser | undefined) {
  useEffect(() => {
    if (!user || user.role !== "technician") return;
    const username = user.username;
    touchTechnicianPresence(username);
    const id = window.setInterval(() => touchTechnicianPresence(username), 30_000);
    return () => window.clearInterval(id);
  }, [user?.username, user?.role]);
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const username = data.username.trim();
      const password = data.password;

      // 1) Validar contra usuarios persistidos en IndexedDB
      const cachedAccount = await getCachedUserAccountByUsername(username);
      if (cachedAccount) {
        if (!cachedAccount.active) throw new Error("Usuario desactivado.");
        if (cachedAccount.password !== password) throw new Error("Usuario o contraseña incorrectos");

        const user = {
          id: cachedAccount.id,
          name: cachedAccount.name,
          username: cachedAccount.username,
          role: cachedAccount.role,
        } as const;

        setStoredUser(user);
        await setCachedSessionUser(user);
        return { success: true, user };
      }

      // 2) Fallback contra usuarios temporales (por si todavía no hay seed en IndexedDB)
      const mockUser = checkTempCredentials(username, password);
      if (mockUser) {
        setStoredUser(mockUser);
        await setCachedSessionUser(mockUser);
        return { success: true, user: mockUser };
      }

      throw new Error("Usuario o contraseña incorrectos");
    },
    onSuccess: (data) => {
      if (data.user.role === "technician") {
        touchTechnicianPresence(data.user.username);
      }
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const u = getStoredUser();
      if (u?.role === "technician") {
        removeTechnicianPresence(u.username);
      }
      clearStoredUser();
      await clearCachedSessionUser();
    },
    onSuccess: () => {
      // Evita datos obsoletos: si solo invalidamos, el caché puede seguir mostrando
      // al usuario hasta terminar el refetch y Login hace `return null` → pantalla en blanco.
      queryClient.removeQueries({ queryKey: ["user"] });
    },
  });
}
