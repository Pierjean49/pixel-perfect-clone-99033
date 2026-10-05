import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </div>
  );
}

const boxStyles = {
  retenir: { border: "var(--color-accent)", bg: "var(--color-accent-soft)", label: "À RETENIR" },
  analogie: { border: "var(--color-info)", bg: "var(--color-info-soft)", label: "ANALOGIE D'OFFICINE" },
  questions: { border: "var(--color-success)", bg: "var(--color-success-soft)", label: "QUESTIONS DE COMPRÉHENSION" },
  vigilance: { border: "var(--color-warning)", bg: "var(--color-warning-soft)", label: "POINT DE VIGILANCE" },
} as const;

export function Encadre({
  type,
  titre,
  children,
}: {
  type: keyof typeof boxStyles;
  titre?: string;
  children: ReactNode;
}) {
  const s = boxStyles[type];
  return (
    <div
      className="my-4 rounded-lg border-l-4 px-4 py-3 text-sm"
      style={{ borderLeftColor: s.border, backgroundColor: s.bg }}
    >
      <p className="mb-1 text-[0.7rem] font-semibold tracking-[0.12em]" style={{ color: s.border }}>
        {titre ?? s.label}
      </p>
      <div className="prose-width space-y-2">{children}</div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "accent";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    accent: "bg-accent text-accent-foreground hover:opacity-90",
    secondary: "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "text-primary hover:bg-primary-soft",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: color ? `${color}1a` : "var(--color-muted)",
        color: color ?? "var(--color-muted-foreground)",
      }}
    >
      {children}
    </span>
  );
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {label ? <p className="mt-1 text-xs text-muted-foreground">{label}</p> : null}
    </div>
  );
}

export function PageHeader({
  surtitre,
  titre,
  intro,
}: {
  surtitre: string;
  titre: string;
  intro?: string;
}) {
  return (
    <header className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{surtitre}</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{titre}</h1>
      {intro ? <p className="prose-width mt-3 text-[0.95rem] text-muted-foreground">{intro}</p> : null}
    </header>
  );
}

/** Prévient, juste avant un bouton de lecture automatique, que le document quitte le navigateur. */
export function AvisIA({ quoi = "le document" }: { quoi?: string }) {
  return (
    <p className="mt-2 rounded-md bg-[var(--color-warning-soft)] px-2.5 py-1.5 text-xs text-foreground">
      La lecture automatique envoie {quoi} à un service d'IA externe pour l'analyser. Ne charge
      aucun document contenant des données de patients ; pour un accord confidentiel, préfère la
      saisie à la main.
    </p>
  );
}
