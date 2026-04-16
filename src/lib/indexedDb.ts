const DB_NAME = "soportepro_db";
const DB_VERSION = 2;
const TICKETS_STORE = "tickets";
const SESSION_STORE = "session";
const SESSION_USER_KEY = "current_user";
const USERS_STORE = "users";

export type CachedTicket = Record<string, unknown> & {
  ticketNumber: string;
};

export type CachedUser = {
  id: number;
  name: string;
  username: string;
  role: "admin" | "technician";
};

export type CachedUserAccount = {
  id: number;
  name: string;
  username: string; // key (normalizado)
  role: "admin" | "technician";
  password: string; // modo local/dev
  active: boolean;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB no está disponible en este entorno."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(TICKETS_STORE)) {
        db.createObjectStore(TICKETS_STORE, { keyPath: "ticketNumber" });
      }

      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(USERS_STORE)) {
        db.createObjectStore(USERS_STORE, { keyPath: "username" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir IndexedDB."));
  });
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    openDb()
      .then((db) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Error en operación IndexedDB."));
      tx.onabort = () => reject(tx.error ?? new Error("Transacción abortada en IndexedDB."));
      tx.oncomplete = () => db.close();
      })
      .catch((error) => reject(error));
  });
}

export async function getCachedTickets(): Promise<CachedTicket[]> {
  try {
    return await runTransaction<CachedTicket[]>(TICKETS_STORE, "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
}

export async function getCachedTicketByNumber(ticketNumber: string): Promise<CachedTicket | null> {
  try {
    const ticket = await runTransaction<CachedTicket | undefined>(TICKETS_STORE, "readonly", (store) =>
      store.get(ticketNumber)
    );
    return ticket ?? null;
  } catch {
    return null;
  }
}

export async function upsertCachedTicket(ticket: CachedTicket): Promise<void> {
  try {
    await runTransaction<IDBValidKey>(TICKETS_STORE, "readwrite", (store) => store.put(ticket));
  } catch {
    // Si falla IndexedDB, no se interrumpe el flujo principal de la app.
  }
}

export async function deleteCachedTicket(ticketNumber: string): Promise<void> {
  try {
    await runTransaction<undefined>(TICKETS_STORE, "readwrite", (store) => store.delete(ticketNumber));
  } catch {
    // ignorar
  }
}

function normalizeUsername(username: string): string {
  return (username || "").trim().toLowerCase();
}

function getAssigneeUsernameFromCachedTicket(t: CachedTicket): string | null {
  const raw = t.assignee;
  if (raw && typeof raw === "object" && "username" in raw) {
    const u = (raw as { username: unknown }).username;
    return typeof u === "string" ? u : null;
  }
  return null;
}

/** Elimina tickets cuyo asignado coincide (correo, sin distinguir mayúsculas). Devuelve cuántos se borraron. */
export async function deleteCachedTicketsByAssigneeEmail(email: string): Promise<number> {
  const target = normalizeUsername(email);
  if (!target) return 0;
  try {
    const all = await getCachedTickets();
    const toDelete = all.filter((t) => {
      const u = getAssigneeUsernameFromCachedTicket(t);
      return u != null && normalizeUsername(u) === target;
    });
    if (toDelete.length === 0) return 0;
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TICKETS_STORE, "readwrite");
      const store = tx.objectStore(TICKETS_STORE);
      for (const t of toDelete) {
        const tn = typeof t.ticketNumber === "string" ? t.ticketNumber : "";
        if (tn) store.delete(tn);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error ?? new Error("No se pudieron eliminar tickets."));
      tx.onabort = () => reject(tx.error ?? new Error("Transacción abortada al eliminar tickets."));
    });
    return toDelete.length;
  } catch {
    return 0;
  }
}

export async function upsertCachedTickets(tickets: CachedTicket[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TICKETS_STORE, "readwrite");
      const store = tx.objectStore(TICKETS_STORE);

      tickets.forEach((ticket) => {
        store.put(ticket);
      });

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error ?? new Error("No se pudieron guardar tickets en IndexedDB."));
      tx.onabort = () => reject(tx.error ?? new Error("Transacción abortada al guardar tickets."));
    });
  } catch {
    // Si falla IndexedDB, no se interrumpe el flujo principal de la app.
  }
}

export async function getCachedSessionUser(): Promise<CachedUser | null> {
  try {
    const session = await runTransaction<{ id: string; user: CachedUser } | undefined>(SESSION_STORE, "readonly", (store) =>
      store.get(SESSION_USER_KEY)
    );
    return session?.user ?? null;
  } catch {
    return null;
  }
}

export async function setCachedSessionUser(user: CachedUser): Promise<void> {
  try {
    await runTransaction<IDBValidKey>(SESSION_STORE, "readwrite", (store) =>
      store.put({ id: SESSION_USER_KEY, user })
    );
  } catch {
    // Si falla IndexedDB, no se interrumpe el flujo principal de la app.
  }
}

export async function clearCachedSessionUser(): Promise<void> {
  try {
    await runTransaction<undefined>(SESSION_STORE, "readwrite", (store) => store.delete(SESSION_USER_KEY));
  } catch {
    // Si falla IndexedDB, no se interrumpe el flujo principal de la app.
  }
}

export async function getCachedUserAccounts(): Promise<CachedUserAccount[]> {
  try {
    return await runTransaction<CachedUserAccount[]>(USERS_STORE, "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
}

export async function getCachedUserAccountByUsername(
  username: string
): Promise<CachedUserAccount | null> {
  try {
    const normalized = normalizeUsername(username);
    const account = await runTransaction<CachedUserAccount | undefined>(USERS_STORE, "readonly", (store) =>
      store.get(normalized)
    );
    return account ?? null;
  } catch {
    return null;
  }
}

export async function upsertCachedUserAccount(account: CachedUserAccount): Promise<void> {
  try {
    const normalized: CachedUserAccount = { ...account, username: normalizeUsername(account.username) };
    await runTransaction<IDBValidKey>(USERS_STORE, "readwrite", (store) => store.put(normalized));
  } catch {
    // Ignorar fallos de persistencia local.
  }
}

export async function deleteCachedUserAccount(username: string): Promise<void> {
  try {
    const normalized = normalizeUsername(username);
    await runTransaction<undefined>(USERS_STORE, "readwrite", (store) => store.delete(normalized));
  } catch {
    // Ignorar fallos de persistencia local.
  }
}
