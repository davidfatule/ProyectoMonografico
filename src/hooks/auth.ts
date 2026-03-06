import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  checkTempCredentials,
} from "@/lib/mockAuth";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      // 1) Sin BD: si hay usuario temporal en localStorage, usarlo
      const stored = getStoredUser();
      if (stored) return stored;

      // 2) Con BD más adelante: llamar a la API
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("No autenticado");
        return res.json();
      } catch {
        throw new Error("No autenticado");
      }
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      // 1) Sin BD: comprobar usuario temporal
      const mockUser = checkTempCredentials(data.username, data.password);
      if (mockUser) {
        setStoredUser(mockUser);
        return { success: true, user: mockUser };
      }

      // 2) Con BD más adelante: llamar a la API
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Usuario o contraseña incorrectos");
      return res.json();
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
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // Sin backend está bien
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
