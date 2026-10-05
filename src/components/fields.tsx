import type { ReactNode } from "react";

export function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-1 block text-xs font-medium text-muted-foreground">
      {children}
      {required ? <span className="ml-0.5 text-accent">*</span> : null}
    </span>
  );
}

export function Aide({ children }: { children?: ReactNode }) {
  return children ? (
    <span className="mb-1.5 block text-xs leading-snug text-muted-foreground/80">{children}</span>
  ) : null;
}

export function Text({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  suffix,
  aide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  suffix?: string;
  aide?: string;
}) {
  return (
    <label className="block">
      <Label required={required}>{label}</Label>
      <Aide>{aide}</Aide>
      <span className="flex items-center gap-2">
        <input
          className="field"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function Area({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  aide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  aide?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <Aide>{aide}</Aide>
      <textarea
        className="field"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required,
  allowFree,
  aide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  allowFree?: boolean;
  aide?: string;
}) {
  const known = options.includes(value) || value === "";
  return (
    <label className="block">
      <Label required={required}>{label}</Label>
      <Aide>{aide}</Aide>
      <select
        className="field"
        value={known ? value : "__libre"}
        onChange={(e) => onChange(e.target.value === "__libre" ? " " : e.target.value)}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {allowFree ? <option value="__libre">Saisie libre…</option> : null}
      </select>
      {allowFree && !known ? (
        <input
          className="field mt-2"
          value={value.trim()}
          placeholder="Précise"
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
    </label>
  );
}

export function CheckGroup({
  label,
  options,
  values,
  onToggle,
  columns = 2,
  aide,
}: {
  label?: string;
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
  columns?: number;
  aide?: string;
}) {
  return (
    <div>
      {label ? <Label>{label}</Label> : null}
      <Aide>{aide}</Aide>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`rounded-lg border px-3 py-1.5 text-left text-sm transition ${
                active
                  ? "border-primary bg-primary-soft font-medium text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Radio({
  label,
  options,
  value,
  onChange,
  aide,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  aide?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Aide>{aide}</Aide>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              value === o
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}
