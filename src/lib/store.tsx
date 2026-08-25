import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { emptyForm, type FormState } from "./types";

const KEY = "module-trade-gammes-v1";

type Ctx = {
  form: FormState;
  update: (fn: (draft: FormState) => void) => void;
  replace: (next: FormState) => void;
  reset: () => void;
  savedAt: string | null;
  hydrated: boolean;
};

const FormContext = createContext<Ctx | null>(null);

function deep<T>(base: T, saved: unknown): T {
  if (!saved || typeof saved !== "object" || Array.isArray(saved) || Array.isArray(base)) {
    return (saved === undefined ? base : (saved as T)) ?? base;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === "object" && !Array.isArray(b) ? deep(b, v) : (v ?? b);
  }
  return out as T;
}

function merge(base: FormState, saved: Partial<FormState>): FormState {
  return deep(base, saved);
}

export function FormProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setForm((f) => merge(f, JSON.parse(raw)));
    } catch {
      /* stockage indisponible : on repart d'un formulaire vide */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(form));
        setSavedAt(
          new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h"),
        );
      } catch {
        /* quota dépassé */
      }
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, hydrated]);

  const update = useCallback((fn: (draft: FormState) => void) => {
    setForm((prev) => {
      const draft = structuredClone(prev) as FormState;
      fn(draft);
      return draft;
    });
  }, []);

  const replace = useCallback((next: FormState) => setForm(next), []);
  const reset = useCallback(() => setForm(emptyForm()), []);

  // Sauvegarde de la saisie réelle avant de charger un exemple / réinitialiser
  const snapshot = useCallback((current: FormState) => {
    try {
      window.localStorage.setItem(BACKUP_KEY, JSON.stringify(current));
      setBackupAt(new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }));
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const loadDemo = useCallback(
    (demo: FormState) => {
      setForm((prev) => {
        snapshot(prev);
        return demo;
      });
    },
    [snapshot],
  );

  const saveBackup = useCallback(() => snapshot(form), [form, snapshot]);

  const restoreBackup = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(BACKUP_KEY);
      if (!raw) return false;
      setForm(merge(emptyForm(), JSON.parse(raw)));
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <FormContext.Provider
      value={{
        form,
        update,
        replace,
        reset,
        savedAt,
        hydrated,
        backupAt,
        loadDemo,
        saveBackup,
        restoreBackup,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("useForm doit être utilisé dans FormProvider");
  return ctx;
}
