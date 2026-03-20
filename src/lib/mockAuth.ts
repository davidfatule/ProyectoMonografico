/**
 * Usuarios locales para autenticación en modo IndexedDB/local.
 */

const STORAGE_KEY = "soportepro_user";

export interface MockUser {
  id: number;
  name: string;
  username: string;
  role: "admin" | "technician";
}

/** Credenciales locales */
export const TEMP_USERS: { username: string; password: string; user: MockUser }[] = [
  {
    username: "admin@helpdesk.com",
    password: "admin123456",
    user: { id: 1, name: "Administrador", username: "admin@helpdesk.com", role: "admin" },
  },
  {
    username: "tech@helpdesk.com",
    password: "123456",
    user: { id: 2, name: "Técnico", username: "tech@helpdesk.com", role: "technician" },
  },
];

export function getStoredUser(): MockUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: MockUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function checkTempCredentials(username: string, password: string): MockUser | null {
  const u = (username || "").trim();
  const p = (password || "").trim();
  const found = TEMP_USERS.find(
    (t) => t.username.toLowerCase() === u.toLowerCase() && t.password === p
  );
  return found ? found.user : null;
}
