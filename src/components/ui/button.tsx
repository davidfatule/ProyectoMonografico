import type { ButtonHTMLAttributes } from "react";

interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "outline"; // 👈 ahora acepta outline
}

export function Button({
  size = "md",
  variant = "primary",
  className,
  ...props
}: CustomButtonProps) {
  const baseStyles = "rounded-lg transition font-medium focus:outline-none";

  const sizeStyles =
    size === "lg"
      ? "h-12 text-lg px-6"
      : size === "sm"
      ? "h-8 text-sm px-3"
      : "h-10 text-md px-4";

  const variantStyles =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
      : variant === "secondary"
      ? "bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:opacity-50"
      : variant === "ghost"
      ? "bg-transparent text-primary hover:bg-primary/10 disabled:opacity-50"
      : "border border-primary text-primary bg-transparent hover:bg-primary/10 disabled:opacity-50"; // 👈 estilos para outline

  return (
    <button
      {...props}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className ?? ""}`}
    />
  );
}