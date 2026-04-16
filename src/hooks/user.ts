import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TEMP_USERS } from "@/lib/mockAuth";
import {
  getCachedUserAccounts,
  getCachedUserAccountByUsername,
  upsertCachedUserAccount,
  deleteCachedUserAccount,
  type CachedUserAccount,
} from "@/lib/indexedDb";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const cachedAccounts = await getCachedUserAccounts();
      const cachedUsers = cachedAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        username: a.username,
        role: a.role,
        active: a.active,
      }));

      // Agregar TEMP_USERS si no existen en IndexedDB.
      const map = new Map(cachedUsers.map((u) => [u.username.toLowerCase(), u]));
      for (const temp of TEMP_USERS) {
        const key = temp.user.username.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: temp.user.id,
            name: temp.user.name,
            username: temp.user.username,
            role: temp.user.role,
            active: true,
          });
        }
      }
      return Array.from(map.values());
    },
  });
}

export function useCreateTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { username: string; password: string; name: string }) => {
      const accounts = await getCachedUserAccounts();
      const nextId = accounts.length > 0 ? Math.max(...accounts.map((a) => a.id)) + 1 : 1;

      const newAccount: CachedUserAccount = {
        id: nextId,
        name: data.name.trim() || data.username.trim(),
        username: data.username.trim().toLowerCase(),
        password: data.password,
        role: "technician",
        active: true,
      };

      await upsertCachedUserAccount(newAccount);
      return newAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { username: string; active: boolean; role?: "admin" | "technician" }) => {
      const existing = await getCachedUserAccountByUsername(data.username);
      if (!existing) {
        // Si el usuario no existe en IndexedDB todavía, intentamos crearlo con los valores temporales.
        const temp = TEMP_USERS.find((t) => t.user.username.toLowerCase() === data.username.trim().toLowerCase());
        if (!temp) throw new Error("Usuario no encontrado");

        await upsertCachedUserAccount({
          id: temp.user.id,
          name: temp.user.name,
          username: temp.user.username,
          role: temp.user.role,
          password: temp.password,
          active: data.active,
        });
      }

      const finalExisting = await getCachedUserAccountByUsername(data.username);
      if (!finalExisting) throw new Error("Usuario no encontrado");

      await upsertCachedUserAccount({
        ...finalExisting,
        active: data.active,
        role: data.role ?? finalExisting.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const normalized = username.trim().toLowerCase();
      await deleteCachedUserAccount(normalized);
      return { username: normalized };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}