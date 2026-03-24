import { getTechnicianUsernames } from "@/lib/mockAuth";

const PRESENCE_KEY = "soportepro_tech_presence";
const COUNTER_KEY = "soportepro_assign_counter";

/** Ventana para considerar un técnico "en línea" (heartbeat cada 30s) */
const STALE_MS = 90_000;

function normalizeU(u: string): string {
  return (u || "").trim().toLowerCase();
}

function pruneStaleEntries(): void {
  try {
    const raw = localStorage.getItem(PRESENCE_KEY);
    if (!raw) return;
    const obj: Record<string, number> = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    let changed = false;
    for (const k of Object.keys(obj)) {
      if (now - obj[k]! > STALE_MS) {
        delete obj[k];
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(PRESENCE_KEY, JSON.stringify(obj));
    }
  } catch {
    // ignorar
  }
}

/** Marca al técnico como conectado (llamar al iniciar sesión y en heartbeat). */
export function touchTechnicianPresence(username: string): void {
  try {
    pruneStaleEntries();
    const key = normalizeU(username);
    const raw = localStorage.getItem(PRESENCE_KEY);
    const obj: Record<string, number> = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    obj[key] = Date.now();
    localStorage.setItem(PRESENCE_KEY, JSON.stringify(obj));
  } catch {
    // ignorar
  }
}

/** Quita al técnico de la lista al cerrar sesión. */
export function removeTechnicianPresence(username: string): void {
  try {
    const key = normalizeU(username);
    const raw = localStorage.getItem(PRESENCE_KEY);
    if (!raw) return;
    const obj: Record<string, number> = JSON.parse(raw) as Record<string, number>;
    delete obj[key];
    localStorage.setItem(PRESENCE_KEY, JSON.stringify(obj));
  } catch {
    // ignorar
  }
}

/**
 * Técnicos registrados que tienen presencia reciente (p. ej. pestañas abiertas con sesión de técnico).
 */
export function getOnlineTechnicianUsernames(allowedPool: string[]): string[] {
  const allowed = new Set(allowedPool.map(normalizeU));
  pruneStaleEntries();
  try {
    const raw = localStorage.getItem(PRESENCE_KEY);
    if (!raw) return [];
    const obj: Record<string, number> = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    const online: string[] = [];
    for (const [email, ts] of Object.entries(obj)) {
      if (now - ts > STALE_MS) continue;
      if (!allowed.has(normalizeU(email))) continue;
      online.push(email);
    }
    return online.sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function incrementAssignCounter(): number {
  try {
    const n = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10) || 0;
    localStorage.setItem(COUNTER_KEY, String(n + 1));
    return n;
  } catch {
    return 0;
  }
}

/**
 * Siguiente asignado: round-robin entre técnicos con sesión activa (heartbeat).
 * Si ninguno está en línea, reparte entre los tres técnicos del sistema.
 */
export function getNextTechnicianAssigneeUsername(): string {
  const poolAll = getTechnicianUsernames();
  const online = getOnlineTechnicianUsernames(poolAll);
  const pool = online.length > 0 ? online : poolAll;
  const idx = incrementAssignCounter();
  return pool[idx % pool.length];
}
