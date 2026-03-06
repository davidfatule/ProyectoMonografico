import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: "primary" | "secondary";
  variant?: "default" | "success" | "warning" | "info" | "destructive"; // 👈 agregado
}

export function Badge({
  children,
  color = "primary",
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  const base = "inline-block px-3 py-1 rounded-full text-xs font-medium";

  const colorStyles =
    color === "primary"
      ? "bg-primary text-white"
      : "bg-slate-200 text-slate-700";

  const variantStyles =
    variant === "success"
      ? "bg-green-100 text-green-800"
      : variant === "warning"
      ? "bg-yellow-100 text-yellow-800"
      : variant === "info"
      ? "bg-blue-100 text-blue-800"
      : variant === "destructive"
      ? "bg-red-100 text-red-800"
      : ""; // default no agrega nada extra

  return (
    <span
      {...props}
      className={`${base} ${colorStyles} ${variantStyles} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
