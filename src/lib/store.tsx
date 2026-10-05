import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { emptyForm, type FormState } from "./types";

const KEY = "module-trade-gammes-v1";
const BACKUP_KEY = "module-trade-gammes-v1-backup";
const RECOVERY_KEY = "module-trade-gammes-v1-recovery";
const LAST_GOOD_KEY = "module-trade-gammes-v1-last-good";
const HISTORY_KEY = "module-trade-gammes-v1-history";
// Les contenus lourds (plan de la pharmacie, texte des documents importés) sont
// rangés à part, en un seul exemplaire, pour ne pas saturer le stockage du navigateur.
const FILES_KEY = "module-trade-gammes-v1-fichiers";
const FILES_BACKUP_KEY = "module-trade-gammes-v1-fichiers-backup";
const MAX_HISTORY = 12;
const DELAI_SAUVEGARDE = 500;

type Snapshot = { savedAt: string; form: FormState };
type Fichiers = {
  plan: string;
  imports: Record<string, { texte: string; lignes: string[][] }>;
};

type Ctx = {
  form: FormState;
  update: (fn: (draft: FormState) => void) => void;
  replace: (next: FormState) => void;
  reset: () => void;
  savedAt: string | null;
  saveError: boolean;
  hydrated: boolean;
  backupAt: string | null;
  recoveryCount: number;
  loadDemo: (demo: FormState) => void;
  saveBackup: () => void;
  restoreBackup: () => boolean;
  restoreLatestRecovery: () => boolean;
};

const FormContext = createContext<Ctx | null>(null);

/* ---------- lecture tolérante d'une sauvegarde ---------- */

const estObjet = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

// Listes dont chaque élément doit être un objet : un élément d'un autre type ferait planter l'affichage.
const LISTES_OBJETS = new Set([
  "poles",
  "equipe",
  "gammes",
  "plans",
  "imports_plans",
  "objectifs.saisonnalite",
  "primes.paliers",
  "merch.emplacements",
]);

/**
 * Fusionne une sauvegarde dans le formulaire vide. Toute valeur dont le type ne
 * correspond pas à celui attendu est ignorée : un fichier abîmé ne casse pas l'appli.
 */
function deep<T>(base: T, saved: unknown, chemin = ""): T {
  if (saved === undefined || saved === null) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(saved)) return base;
    const liste = LISTES_OBJETS.has(chemin)
      ? saved.filter(estObjet)
      : saved.filter((x) => typeof x === "string" || estObjet(x));
    return liste as T;
  }
  if (estObjet(base)) {
    if (!estObjet(saved)) return base;
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(saved)) {
      const sous = chemin ? `${chemin}.${k}` : k;
      if (k in base) {
        const b = base[k];
        out[k] = b === null ? (typeof v === "string" ? v : null) : deep(b, v, sous);
      } else if (LISTES_OBJETS.has(sous)) {
        out[k] = Array.isArray(v) ? v.filter(estObjet) : undefined;
      } else {
        out[k] = v; // champ facultatif absent du formulaire vide (ex. merch.plan)
      }
    }
    return out as T;
  }
  return (typeof saved === typeof base ? saved : base) as T;
}

/** Vrai si l'objet ressemble à une sauvegarde du formulaire. */
export function estSauvegardeValide(v: unknown): boolean {
  return estObjet(v) && estObjet(v["identite"]);
}

function merge(base: FormState, saved: unknown): FormState {
  const f = deep(base, saved);
  const plan = f.merch.plan;
  if (plan && (typeof plan.data !== "string" || typeof plan.nom !== "string")) f.merch.plan = null;
  f.imports_plans = f.imports_plans.map((d) => ({
    ...d,
    texte: typeof d.texte === "string" ? d.texte : "",
    lignes: Array.isArray(d.lignes) ? d.lignes.filter(Array.isArray) : [],
  }));
  return f;
}

/* ---------- séparation contenus lourds / formulaire ---------- */

function alleger(f: FormState): FormState {
  return {
    ...f,
    merch: { ...f.merch, plan: f.merch.plan ? { ...f.merch.plan, data: "" } : f.merch.plan },
    imports_plans: f.imports_plans.map((d) => ({ ...d, texte: "", lignes: [] })),
  };
}

function fichiersDe(f: FormState): Fichiers {
  const imports: Fichiers["imports"] = {};
  for (const d of f.imports_plans) imports[d.id] = { texte: d.texte, lignes: d.lignes };
  return { plan: f.merch.plan?.data ?? "", imports };
}

function signature(f: FormState): string {
  return [
    f.merch.plan ? `${f.merch.plan.nom}:${f.merch.plan.data.length}` : "",
    ...f.imports_plans.map((d) => `${d.id}:${d.texte.length}:${d.lignes.length}`),
  ].join("|");
}

/** Remet les contenus lourds dans un formulaire allégé. Ce qui est introuvable est retiré. */
function rattacher(f: FormState, x: Fichiers | null): FormState {
  const plan = f.merch.plan;
  const data = plan ? plan.data || x?.plan || "" : "";
  return {
    ...f,
    merch: { ...f.merch, plan: plan && data ? { ...plan, data } : null },
    imports_plans: f.imports_plans
      .map((d) => {
        if (d.texte || d.lignes.length) return d;
        const c = x?.imports[d.id];
        return c ? { ...d, texte: c.texte ?? "", lignes: c.lignes ?? [] } : d;
      })
      .filter((d) => d.texte || d.lignes.length),
  };
}

function readFiles(key: string): Fichiers | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!estObjet(p)) return null;
    return {
      plan: typeof p["plan"] === "string" ? p["plan"] : "",
      imports: estObjet(p["imports"]) ? (p["imports"] as Fichiers["imports"]) : {},
    };
  } catch {
    return null;
  }
}

/* ---------- score et historique ---------- */

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
  return score(alleger(value)) > EMPTY_SCORE;
}

function readStored(key: string): FormState | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  return merge(emptyForm(), JSON.parse(raw));
}

function readHistory(): Snapshot[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Snapshot & Record<string, unknown> =>
          estObjet(item) && typeof item["savedAt"] === "string" && estObjet(item["form"]),
      )
      .map((item) => ({ ...item, form: alleger(merge(emptyForm(), item.form)) }))
      .filter((item) => isMeaningful(item.form));
  } catch {
    return [];
  }
}

/** Archive une version allégée du formulaire (sans plan ni texte des documents). */
function archive(leger: FormState, force = false): number {
  if (!isMeaningful(leger)) return readHistory().length;
  const history = readHistory();
  const serialized = JSON.stringify(leger);
  const latest = history[0];
  if (latest && JSON.stringify(latest.form) === serialized) return history.length;
  const latestAge = latest ? Date.now() - Date.parse(latest.savedAt) : Number.POSITIVE_INFINITY;
  if (!force && latest && latestAge < 30_000) {
    history[0] = { savedAt: new Date().toISOString(), form: leger };
  } else {
    history.unshift({ savedAt: new Date().toISOString(), form: leger });
  }
  const trimmed = history.slice(0, MAX_HISTORY);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  return trimmed.length;
}

/**
 * Les versions précédentes rangeaient le plan et les documents dans chaque copie de
 * sécurité. On allège ces copies une fois pour toutes afin de libérer le stockage.
 */
function migrerAnciennesCopies() {
  try {
    const history = readHistory();
    if (history.length) window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    for (const key of [LAST_GOOD_KEY, RECOVERY_KEY]) {
      const f = readStored(key);
      if (f && signature(f)) window.localStorage.setItem(key, JSON.stringify(alleger(f)));
    }
    const backup = readStored(BACKUP_KEY);
    if (backup && signature(backup)) {
      try {
        window.localStorage.setItem(FILES_BACKUP_KEY, JSON.stringify(fichiersDe(backup)));
      } catch {
        /* pas la place : la saisie est conservée, sans son plan ni ses documents */
      }
      window.localStorage.setItem(BACKUP_KEY, JSON.stringify(alleger(backup)));
    }
  } catch {
    /* rien à migrer ou stockage indisponible */
  }
}

const heure = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");

/* ---------- fournisseur ---------- */

export function FormProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [backupAt, setBackupAt] = useState<string | null>(null);
  const [recoveryCount, setRecoveryCount] = useState(0);

  const dernier = useRef<FormState>(form); // dernière version connue, pour l'enregistrement à la fermeture
  const aEcrire = useRef(false);
  const sigFichiers = useRef<string | null>(null);

  const persist = useCallback((next: FormState) => {
    aEcrire.current = false;
    try {
      const leger = alleger(next);
      const sig = signature(next);
      // 1. Contenus lourds : réécrits seulement s'ils ont changé.
      if (sig !== sigFichiers.current) {
        if (sig) window.localStorage.setItem(FILES_KEY, JSON.stringify(fichiersDe(next)));
        else window.localStorage.removeItem(FILES_KEY);
        sigFichiers.current = sig;
      }
      // 2. Copie de secours si l'écriture contient soudainement moins de données.
      const previous = readStored(KEY);
      const prevLeger = previous ? alleger(previous) : null;
      if (prevLeger && score(prevLeger) > score(leger)) {
        window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(prevLeger));
        archive(prevLeger, true);
      }
      // 3. Saisie courante, puis copies de sécurité (jamais remplacées par un formulaire vide).
      window.localStorage.setItem(KEY, JSON.stringify(leger));
      if (isMeaningful(leger)) {
        window.localStorage.setItem(LAST_GOOD_KEY, JSON.stringify(leger));
        setRecoveryCount(archive(leger));
      }
      setSavedAt(heure());
      setSaveError(false);
      toast.dismiss("erreur-sauvegarde");
    } catch {
      setSaveError(true);
      toast.error(
        "Sauvegarde impossible : le stockage de ce navigateur est plein ou indisponible. Exporte ton formulaire (.json) pour ne rien perdre, puis retire le plan ou des documents importés.",
        { id: "erreur-sauvegarde", duration: Infinity },
      );
    }
  }, []);

  // Chargement initial.
  useEffect(() => {
    let depart: FormState | null = null;
    try {
      migrerAnciennesCopies();
      const fichiers = readFiles(FILES_KEY);
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
        depart = rattacher(safest, fichiers);
        setSavedAt("saisie restaurée");
      }
      if (window.localStorage.getItem(BACKUP_KEY)) setBackupAt("sauvegarde disponible");
    } catch {
      /* stockage indisponible ou illisible : on repart d'un formulaire vide */
    }
    if (depart) {
      dernier.current = depart;
      setForm(depart);
    }
    setHydrated(true);
  }, []);

  // Enregistrement différé : une écriture 0,5 s après la dernière modification, et non à chaque frappe.
  useEffect(() => {
    if (!hydrated) return;
    dernier.current = form;
    aEcrire.current = true;
    const t = window.setTimeout(() => persist(form), DELAI_SAUVEGARDE);
    return () => window.clearTimeout(t);
  }, [form, hydrated, persist]);

  // Rien ne doit rester en attente quand l'onglet est fermé ou mis en arrière-plan.
  useEffect(() => {
    const vider = () => {
      if (aEcrire.current) persist(dernier.current);
    };
    const surMasquage = () => {
      if (document.visibilityState === "hidden") vider();
    };
    window.addEventListener("pagehide", vider);
    document.addEventListener("visibilitychange", surMasquage);
    return () => {
      window.removeEventListener("pagehide", vider);
      document.removeEventListener("visibilitychange", surMasquage);
    };
  }, [persist]);

  const update = useCallback((fn: (draft: FormState) => void) => {
    setForm((prev) => {
      const draft = structuredClone(prev) as FormState;
      fn(draft);
      return draft;
    });
  }, []);

  const replace = useCallback((next: FormState) => {
    setForm(merge(emptyForm(), next));
  }, []);

  // Sauvegarde de la saisie réelle avant de charger un exemple / réinitialiser.
  const snapshot = useCallback((current: FormState) => {
    try {
      const leger = alleger(current);
      window.localStorage.setItem(BACKUP_KEY, JSON.stringify(leger));
      if (isMeaningful(leger)) {
        window.localStorage.setItem(LAST_GOOD_KEY, JSON.stringify(leger));
        setRecoveryCount(archive(leger, true));
      }
      setBackupAt(new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }));
    } catch {
      /* stockage indisponible */
    }
    try {
      // Le plan et les documents sont gardés à part ; s'ils ne tiennent pas, la saisie reste sauvegardée.
      if (signature(current))
        window.localStorage.setItem(FILES_BACKUP_KEY, JSON.stringify(fichiersDe(current)));
      else window.localStorage.removeItem(FILES_BACKUP_KEY);
    } catch {
      try {
        window.localStorage.removeItem(FILES_BACKUP_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const loadDemo = useCallback(
    (demo: FormState) => {
      snapshot(dernier.current);
      setForm(demo);
    },
    [snapshot],
  );

  const saveBackup = useCallback(() => snapshot(dernier.current), [snapshot]);

  const reset = useCallback(() => {
    snapshot(dernier.current);
    try {
      window.localStorage.removeItem(RECOVERY_KEY);
    } catch {
      /* ignore */
    }
    setForm(emptyForm());
  }, [snapshot]);

  const restoreBackup = useCallback(() => {
    try {
      const backup = readStored(BACKUP_KEY);
      if (!backup) return false;
      setForm(rattacher(backup, readFiles(FILES_BACKUP_KEY)));
      return true;
    } catch {
      return false;
    }
  }, []);

  const restoreLatestRecovery = useCallback(() => {
    try {
      const history = readHistory();
      const restored = history[0]?.form ?? readStored(LAST_GOOD_KEY);
      if (!restored || !isMeaningful(restored)) return false;
      // Les documents encore présents dans le navigateur sont rattachés ; les autres sont retirés.
      setForm(rattacher(restored, readFiles(FILES_KEY) ?? fichiersDe(dernier.current)));
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
        saveError,
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
