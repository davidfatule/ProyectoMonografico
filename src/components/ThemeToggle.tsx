import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={(e) => toggle(e)}
      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 touch-manipulation min-h-[44px] min-w-[44px] inline-flex items-center justify-center shrink-0"
      aria-label={isDark ? "Activar modo claro" : "Activar modo nocturno"}
      title={isDark ? "Modo claro" : "Modo nocturno"}
    >
      {isDark ? <Sun className="w-5 h-5" aria-hidden /> : <Moon className="w-5 h-5" aria-hidden />}
    </button>
  );
}
