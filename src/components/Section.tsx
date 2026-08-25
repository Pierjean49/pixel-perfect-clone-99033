import { useState, type ReactNode } from "react";

export function Section({
  numero,
  titre,
  intro,
  rempli,
  total,
  defaultOpen = false,
  children,
}: {
  numero: number;
  titre: string;
  intro: string;
  rempli: number;
  total: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const complet = total > 0 && rempli >= total;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-6"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={{
            backgroundColor: complet ? "var(--color-success-soft)" : "var(--color-primary-soft)",
            color: complet ? "var(--color-success)" : "var(--color-primary)",
          }}
        >
          {numero}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold">{titre}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{intro}</span>
        </span>
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
          {rempli}/{total} champs renseignés
        </span>
        <span className="shrink-0 text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open ? <div className="border-t border-border px-4 py-5 sm:px-6">{children}</div> : null}
    </section>
  );
}

export function Grid({ children, cols = 3 }: { children: ReactNode; cols?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 3 ? 220 : 280}px, 1fr))` }}
    >
      {children}
    </div>
  );
}
