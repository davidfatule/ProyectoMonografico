/** Columna compartida: tipo de cliente y RNC si aplica (empresa/negocio). */
export function ClientTypeCell({
  clientType,
  rnc,
}: {
  clientType?: string | null;
  rnc?: string | null;
}) {
  const label =
    clientType === "empresa"
      ? "Empresa"
      : clientType === "negocio"
        ? "Negocio"
        : clientType === "individual"
          ? "Individual"
          : "—";
  const showRnc =
    (clientType === "empresa" || clientType === "negocio") && Boolean(rnc?.trim());

  return (
    <div className="min-w-[6.5rem] max-w-[12rem]">
      <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
      {showRnc ? (
        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400" title={rnc ?? undefined}>
          RNC: {rnc}
        </span>
      ) : null}
    </div>
  );
}
