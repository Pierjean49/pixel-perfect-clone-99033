import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { emptyForm, type FormState } from "./types";

const KEY = "module-trade-gammes-v1";
const BACKUP_KEY = "module-trade-gammes-v1-backup";
const RECOVERY_KEY = "module-trade-gammes-v1-recovery";
const LAST_GOOD_KEY = "module-trade-gammes-v1-last-good";
const HISTORY_KEY = "module-trade-gammes-v1-history";
const MAX_HISTORY = 12;

type Snapshot = { savedAt: string; form: FormState };

type Ctx = {
  form: FormState;
  update: (fn: (draft: FormState) => void) => void;
  replace: (next: FormState) => void;
  reset: () => void;
  savedAt: string | null;
  hydrated: boolean;
  backupAt: string | null;
  recoveryCount: number;
  loadDemo: (demo: FormState) => void;
  saveBackup: () => void;
  restoreBackup: () => boolean;
  restoreLatestRecovery: () => boolean;
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
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (total, item) => total + score(item),
      0,
    );
  }
  return value === true || (typeof value === "string" && value.trim() !== "") ? 1 : 0;
}

const EMPTY_SCORE = score(emptyForm());

function isMeaningful(value: FormState): boolean {
  return score(value) > EMPTY_SCORE;
}

function readStored(key: string): FormState | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  return merge(emptyForm(), JSON.parse(raw) as Partial<FormState>);
}

function readHistory(): Snapshot[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Snapshot =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as Snapshot).savedAt === "string" &&
          Boolean((item as Snapshot).form),
      )
      .map((item) => ({ ...item, form: merge(emptyForm(), item.form) }))
      .filter((item) => isMeaningful(item.form));
  } catch {
    return [];
  }
}

function archive(value: FormState, force = false): number {
  if (!isMeaningful(value)) return readHistory().length;
  try {
    const history = readHistory();
    const serialized = JSON.stringify(value);
    const latest = history[0];
    const sameAsLatest = latest && JSON.stringify(latest.form) === serialized;
    const latestAge = latest ? Date.now() - Date.parse(latest.savedAt) : Number.POSITIVE_INFINITY;

    if (sameAsLatest) return history.length;
    if (!force && latest && latestAge < 30_000) {
      history[0] = { savedAt: new Date().toISOString(), form: value };
    } else {
      history.unshift({ savedAt: new Date().toISOString(), form: value });
    }
    const trimmed = history.slice(0, MAX_HISTORY);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    return trimmed.length;
  } catch {
    return 0;
  }
}

export function FormProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [backupAt, setBackupAt] = useState<string | null>(null);
  const [recoveryCount, setRecoveryCount] = useState(0);

  const persist = useCallback((next: FormState) => {
    try {
      const previous = readStored(KEY);
      // Garde une copie supplémentaire si une écriture contient soudainement moins de données.
      if (previous && score(previous) > score(next)) {
        window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(previous));
        archive(previous, true);
      }
      if (isMeaningful(next)) {
        // Cette copie n'est jamais remplacée par un formulaire vide.
        window.localStorage.setItem(LAST_GOOD_KEY, JSON.stringify(next));
        setRecoveryCount(archive(next));
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
      const lastGood = readStored(LAST_GOOD_KEY);
      const recovery = readStored(RECOVERY_KEY);
      const backup = readStored(BACKUP_KEY);
      const history = readHistory();
      setRecoveryCount(history.length);
      // Toujours reprendre la saisie courante si elle contient des données.
      // Si elle a été écrasée par un état vide, reprendre la dernière copie valide.
      const safest =
        (current && isMeaningful(current) ? current : null) ??
        (lastGood && isMeaningful(lastGood) ? lastGood : null) ??
        history[0]?.form ??
        (recovery && isMeaningful(recovery) ? recovery : null) ??
        (backup && isMeaningful(backup) ? backup : null);
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
      if (isMeaningful(current)) {
        window.localStorage.setItem(LAST_GOOD_KEY, JSON.stringify(current));
        setRecoveryCount(archive(current, true));
      }
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

  const restoreLatestRecovery = useCallback(() => {
    try {
      const history = readHistory();
      const lastGood = readStored(LAST_GOOD_KEY);
      const restored = history[0]?.form ?? lastGood;
      if (!restored || !isMeaningful(restored)) return false;
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
        recoveryCount,
        loadDemo,
        saveBackup,
        restoreBackup,
        restoreLatestRecovery,
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
