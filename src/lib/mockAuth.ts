/**
 * Usuarios locales para autenticación en modo IndexedDB/local.
 */

/** Sesión por pestaña para permitir varios técnicos en distintas pestañas */
const STORAGE_KEY = "soportepro_user";

function sessionStore(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export interface MockUser {
  id: number;
  name: string;
  username: string;
  role: "admin" | "technician";
}

/** Lista fija de correos técnico (misma base que TEMP_USERS) */
export function getTechnicianUsernames(): string[] {
  return TEMP_USERS.filter((t) => t.user.role === "technician")
    .map((t) => t.user.username)
    .sort((a, b) => a.localeCompare(b));
}

/** Primer técnico para datos legacy sin asignado (solo visualización) */
export function getFirstTechnicianUsername(): string {
  const list = getTechnicianUsernames();
  return list[0] ?? "david@helpdesk.com";
}

/** Credenciales locales */
export const TEMP_USERS: { username: string; password: string; user: MockUser }[] = [
  {
    username: "admin@helpdesk.com",
    password: "admin123456",
    user: { id: 1, name: "Administrador", username: "admin@helpdesk.com", role: "admin" },
  },
  {
    username: "david@helpdesk.com",
    password: "123456",
    user: { id: 2, name: "David", username: "david@helpdesk.com", role: "technician" },
  },
  {
    username: "damian@helpdesk.com",
    password: "123456",
    user: { id: 3, name: "Damian", username: "damian@helpdesk.com", role: "technician" },
  },
  {
    username: "luis@helpdesk.com",
    password: "123456",
    user: { id: 4, name: "Luis", username: "luis@helpdesk.com", role: "technician" },
  },
];

export function getStoredUser(): MockUser | null {
  try {
    const raw = sessionStore()?.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: MockUser): void {
  sessionStore()?.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  sessionStore()?.removeItem(STORAGE_KEY);
}

export function checkTempCredentials(username: string, password: string): MockUser | null {
  const u = (username || "").trim();
  const p = (password || "").trim();
  const found = TEMP_USERS.find(
    (t) => t.username.toLowerCase() === u.toLowerCase() && t.password === p
  );
  return found ? found.user : null;
}
