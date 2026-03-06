/**
 * Usuario temporal para desarrollo (sin BD).
 * Cuando tengas MySQL, quitarás esto y usarás solo la API real.
 */

const STORAGE_KEY = "soportepro_user";

export interface MockUser {
  id: number;
  name: string;
  username: string;
  role: "admin" | "technician";
}

/** Credenciales temporales (cambiar cuando conectes MySQL) */
export const TEMP_USERS: { username: string; password: string; user: MockUser }[] = [
  {
    username: "admin",
    password: "admin123",
    user: { id: 1, name: "Administrador", username: "admin", role: "admin" },
  },
  {
    username: "tecnico1",
    password: "tecnico123",
    user: { id: 2, name: "Técnico Soporte", username: "tecnico1", role: "technician" },
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
