import { useCallback, useLayoutEffect, useState, type MouseEvent } from "react";
import {
  setThemeDark,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  getStoredThemeIsDark,
  applyDarkToDom,
} from "@/lib/theme";

function readIsDarkFromDom(): boolean {
  const onHtml = document.documentElement.classList.contains("dark");
  const onBody = document.body?.classList.contains("dark") ?? false;
  return onHtml || onBody;
}

export function useTheme() {
  const [isDark, setIsDark] = useState(() => readIsDarkFromDom());

  useLayoutEffect(() => {
    const sync = () => setIsDark(readIsDarkFromDom());

    window.addEventListener(THEME_CHANGE_EVENT, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      applyDarkToDom(getStoredThemeIsDark());
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    };
    window.addEventListener("storage", onStorage);
    sync();

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setDark = useCallback((dark: boolean) => {
    setThemeDark(dark);
    setIsDark(dark);
  }, []);

  const toggle = useCallback((e?: MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    const next = !readIsDarkFromDom();
    setThemeDark(next);
    setIsDark(next);
  }, []);

  return { isDark, toggle, setDark };
}

export { THEME_STORAGE_KEY } from "@/lib/theme";
