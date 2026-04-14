/** Clave nueva: evita estados corruptos de versiones anteriores; sin valor = modo claro. */
export const THEME_STORAGE_KEY = "andrickson-theme-v2";

export const THEME_CHANGE_EVENT = "andrickson-theme-change";

const LEGACY_THEME_KEY = "andrickson-theme";

/** Solo hay modo oscuro si el usuario lo guardó explícitamente. */
export function getStoredThemeIsDark(): boolean {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

/** Aplica la clase `dark` en `<html>` y `<body>` (Tailwind exige un ancestro con `.dark`). */
export function applyDarkToDom(dark: boolean) {
  const root = document.documentElement;
  const body = document.body;
  if (dark) {
    root.classList.add("dark");
    body?.classList.add("dark");
  } else {
    root.classList.remove("dark");
    body?.classList.remove("dark");
  }
}

/** Persiste y aplica; en modo claro se borra la entrada (por defecto = claro al cargar). */
export function setThemeDark(dark: boolean) {
  try {
    localStorage.removeItem(LEGACY_THEME_KEY);
    if (dark) localStorage.setItem(THEME_STORAGE_KEY, "dark");
    else localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  applyDarkToDom(dark);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Antes de React: solo DOM, sin eventos. */
export function initTheme() {
  if (typeof document === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_THEME_KEY);
  } catch {
    /* ignore */
  }
  applyDarkToDom(getStoredThemeIsDark());
}
