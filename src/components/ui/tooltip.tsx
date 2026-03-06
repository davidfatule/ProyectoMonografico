import { useState } from "react";
import type { ReactNode } from "react";

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded">
          {text}
        </div>
      )}
    </div>
  );
}

// ✅ Agregamos también el TooltipProvider
interface TooltipProviderProps {
  children: ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  // Por ahora solo devuelve los children, pero aquí podrías añadir lógica global
  return <>{children}</>;
}
