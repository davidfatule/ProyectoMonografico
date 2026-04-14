import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative rounded-xl border border-slate-200/80 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-4 ${className ?? ""}`}>{children}</div>;
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className ?? ""}`}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-xl font-bold text-slate-900 dark:text-slate-100 ${className ?? ""}`}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`text-slate-600 dark:text-slate-400 ${className ?? ""}`}>{children}</p>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`mt-6 flex justify-end gap-2 ${className ?? ""}`}>{children}</div>;
}