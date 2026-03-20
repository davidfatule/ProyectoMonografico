import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  checkTempCredentials,
} from "@/lib/mockAuth";
import {
  getCachedSessionUser,
  setCachedSessionUser,
  clearCachedSessionUser,
} from "@/lib/indexedDb";
import { getCachedUserAccountByUsername } from "@/lib/indexedDb";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const cachedSessionUser = await getCachedSessionUser();
      if (cachedSessionUser) {
        setStoredUser(cachedSessionUser);
        return cachedSessionUser;
      }

      const stored = getStoredUser();
      if (stored) return stored;
      throw new Error("No autenticado");
    },
    retry: false,
  });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      clearStoredUser();
      await clearCachedSessionUser();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
