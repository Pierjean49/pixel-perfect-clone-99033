import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { emptyForm, type FormState } from "./types";

const KEY = "module-trade-gammes-v1";
const BACKUP_KEY = "module-trade-gammes-v1-backup";
const RECOVERY_KEY = "module-trade-gammes-v1-recovery";

type Ctx = {
  form: FormState;
  update: (fn: (draft: FormState) => void) => void;
  replace: (next: FormState) => void;
  reset: () => void;
  savedAt: string | null;
  hydrated: boolean;
  backupAt: string | null;
  loadDemo: (demo: FormState) => void;
  saveBackup: () => void;
  restoreBackup: () => boolean;
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

function score(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((total, item) => total + score(item), value.length);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce((total, item) => total + score(item), 0);
  }
  return value === true || (typeof value === "string" && value.trim() !== "") ? 1 : 0;
}

function readStored(key: string): FormState | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  return merge(emptyForm(), JSON.parse(raw) as Partial<FormState>);
}

export function FormProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [backupAt, setBackupAt] = useState<string | null>(null);

  const persist = useCallback((next: FormState) => {
    try {
      const previous = readStored(KEY);
      // Garde une copie supplémentaire si une écriture contient soudainement moins de données.
      if (previous && score(previous) > score(next)) {
        window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(previous));
      }
      window.localStorage.setItem(KEY, JSON.stringify(next));
      setSavedAt(
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h"),
      );
    } catch {
      /* stockage indisponible ou quota dépassé */
    }
  }, []);

  useEffect(() => {
    try {
      const current = readStored(KEY);
      const recovery = readStored(RECOVERY_KEY);
      const safest = current && (!recovery || score(current) >= score(recovery)) ? current : recovery;
      if (safest) {
        setForm(safest);
        window.localStorage.setItem(KEY, JSON.stringify(safest));
        setSavedAt("saisie restaurée");
      }
    } catch {
      try {
        const backup = readStored(BACKUP_KEY);
        if (backup) {
          setForm(backup);
          setSavedAt("sauvegarde restaurée");
        }
      } catch {
        /* stockage indisponible : on repart d'un formulaire vide */
      }
    }
    try {
      const rawBackup = window.localStorage.getItem(BACKUP_KEY);
      if (rawBackup) setBackupAt("sauvegarde disponible");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const update = useCallback((fn: (draft: FormState) => void) => {
    setForm((prev) => {
      const draft = structuredClone(prev) as FormState;
      fn(draft);
      persist(draft);
      return draft;
    });
  }, [persist]);

  const replace = useCallback((next: FormState) => {
    const merged = merge(emptyForm(), next);
    setForm(merged);
    persist(merged);
  }, [persist]);

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
        persist(demo);
        return demo;
      });
    },
    [persist, snapshot],
  );

  const saveBackup = useCallback(() => snapshot(form), [form, snapshot]);

  const reset = useCallback(() => {
    snapshot(form);
    const blank = emptyForm();
    try {
      window.localStorage.removeItem(RECOVERY_KEY);
    } catch {
      /* ignore */
    }
    setForm(blank);
    persist(blank);
  }, [form, persist, snapshot]);

  const restoreBackup = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(BACKUP_KEY);
      if (!raw) return false;
      const restored = merge(emptyForm(), JSON.parse(raw));
      setForm(restored);
      persist(restored);
      return true;
    } catch {
      return false;
    }
  }, [persist]);

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
