import { uid, type ImportPlan, type PlanTrade } from "./types";

export const PORTEES_IMPORT = [
  "Plan trade annuel d'un laboratoire",
  "Plan trade annuel de tous les laboratoires",
  "Plan trade mensuel de tous les laboratoires",
  "Autre document",
] as const;

export type { ImportPlan };

const MAX_TEXTE = 60000;
const MAX_LIGNES = 400;

export function extension(nom: string) {
  const i = nom.lastIndexOf(".");
  return i >= 0 ? nom.slice(i + 1).toLowerCase() : "";
}

/* ---------- lecture des fichiers ---------- */

function parseCsv(texte: string): string[][] {
  const sep = (texte.match(/;/g)?.length ?? 0) >= (texte.match(/,/g)?.length ?? 0) ? ";" : ",";
  const lignes: string[][] = [];
  let ligne: string[] = [];
  let champ = "";
  let quote = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (quote) {
      if (c === '"' && texte[i + 1] === '"') {
        champ += '"';
        i++;
      } else if (c === '"') quote = false;
      else champ += c;
      continue;
    }
    if (c === '"') quote = true;
    else if (c === sep) {
      ligne.push(champ.trim());
      champ = "";
    } else if (c === "\n") {
      ligne.push(champ.trim());
      lignes.push(ligne);
      ligne = [];
      champ = "";
    } else if (c !== "\r") champ += c;
  }
  ligne.push(champ.trim());
  if (ligne.some(Boolean)) lignes.push(ligne);
  return lignes.filter((l) => l.some((c) => c !== ""));
}

async function lireExcel(file: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const out: string[][] = [];
  for (const nom of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nom], {
      header: 1,
      blankrows: false,
      defval: "",
    });
    for (const r of rows) {
      const cells = (r as unknown[]).map((c) => String(c ?? "").trim());
      if (cells.some(Boolean)) out.push(cells);
    }
  }
  return out;
}

async function lirePdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default as string;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    );
  }
  return pages.join("\n\n");
}

async function lireWord(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return res.value;
}

export async function lireFichier(file: File): Promise<ImportPlan> {
  // Lecteurs de fichiers réservés au navigateur : jamais embarqués côté serveur.
  if (import.meta.env.SSR) throw new Error("Lecture de fichier disponible dans le navigateur uniquement.");
  const ext = extension(file.name);
  let lignes: string[][] = [];
  let texte = "";

  if (ext === "csv" || ext === "tsv" || ext === "txt" || ext === "md") {
    texte = await file.text();
    lignes = parseCsv(texte);
  } else if (ext === "xlsx" || ext === "xls" || ext === "xlsm") {
    lignes = await lireExcel(file);
    texte = lignes.map((l) => l.join(" | ")).join("\n");
  } else if (ext === "pdf") {
    texte = await lirePdf(file);
  } else if (ext === "docx" || ext === "doc") {
    texte = await lireWord(file);
  } else {
    throw new Error("Format non pris en charge");
  }

  return {
    id: uid(),
    nom_fichier: file.name,
    format: ext.toUpperCase(),
    portee: "",
    importe_le: new Date().toISOString(),
    texte: texte.slice(0, MAX_TEXTE),
    lignes: lignes.slice(0, MAX_LIGNES),
    commentaire: "",
  };
}

/* ---------- conversion d'un tableau en plans trade ---------- */

const CHAMPS: { cle: keyof Colonnes; mots: string[] }[] = [
  { cle: "laboratoire", mots: ["laboratoire", "labo", "fournisseur", "groupe"] },
  { cle: "gamme", mots: ["gamme", "marque", "produit", "famille"] },
  { cle: "periode", mots: ["mois", "periode", "période", "date", "trimestre", "semaine"] },
  { cle: "type_accord", mots: ["type", "accord", "contrat", "operation", "opération", "animation"] },
  { cle: "debut", mots: ["debut", "début", "du"] },
  { cle: "fin", mots: ["fin", "au"] },
  { cle: "interlocuteur", mots: ["interlocuteur", "delegue", "délégué", "contact", "representant"] },
  { cle: "objectif", mots: ["objectif", "engagement", "cible", "montant", "ca "] },
  { cle: "seuil", mots: ["seuil", "palier", "tranche"] },
  { cle: "avantage", mots: ["avantage", "contrepartie obtenue", "gratuit"] },
  { cle: "remise", mots: ["remise", "conditions", "%"] },
  { cle: "rfa", mots: ["rfa"] },
  { cle: "ug", mots: ["ug", "unite gratuite", "unité gratuite"] },
  { cle: "plv", mots: ["plv", "merch", "budget plv"] },
  { cle: "formation", mots: ["formation"] },
  { cle: "commentaire", mots: ["commentaire", "note", "observation", "detail", "détail"] },
];

type Colonnes = {
  laboratoire?: number;
  gamme?: number;
  periode?: number;
  type_accord?: number;
  debut?: number;
  fin?: number;
  interlocuteur?: number;
  objectif?: number;
  seuil?: number;
  avantage?: number;
  remise?: number;
  rfa?: number;
  ug?: number;
  plv?: number;
  formation?: number;
  commentaire?: number;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function detecterEntete(lignes: string[][]): { index: number; colonnes: Colonnes } | null {
  for (let i = 0; i < Math.min(lignes.length, 15); i++) {
    const cellules = lignes[i].map(norm);
    if (!cellules.some((c) => c.includes("labo") || c.includes("fournisseur"))) continue;
    const colonnes: Colonnes = {};
    cellules.forEach((cell, j) => {
      if (!cell) return;
      for (const { cle, mots } of CHAMPS) {
        if (colonnes[cle] !== undefined) continue;
        if (mots.some((m) => cell.includes(norm(m)))) {
          colonnes[cle] = j;
          return;
        }
      }
    });
    if (colonnes.laboratoire !== undefined) return { index: i, colonnes };
  }
  return null;
}

const val = (ligne: string[], idx?: number) => (idx === undefined ? "" : (ligne[idx] ?? "").trim());

export function plansDepuisLignes(lignes: string[][]): PlanTrade[] {
  const entete = detecterEntete(lignes);
  if (!entete) return [];
  const { index, colonnes } = entete;
  const parLabo = new Map<string, PlanTrade>();

  for (const ligne of lignes.slice(index + 1)) {
    const labo = val(ligne, colonnes.laboratoire);
    if (!labo) continue;
    const cle = norm(labo);
    let plan = parLabo.get(cle);
    if (!plan) {
      plan = {
        id: uid(),
        laboratoire: labo,
        gammes: [],
        type_accord: val(ligne, colonnes.type_accord),
        debut: val(ligne, colonnes.debut),
        fin: val(ligne, colonnes.fin),
        interlocuteur: val(ligne, colonnes.interlocuteur),
        objectif_achat: val(ligne, colonnes.objectif),
        paliers: [],
        remise_facture: val(ligne, colonnes.remise),
        rfa: val(ligne, colonnes.rfa),
        ug: val(ligne, colonnes.ug),
        budget_plv: val(ligne, colonnes.plv),
        budget_formation: val(ligne, colonnes.formation),
        contreparties: [],
        date_revue: "",
        convention: "",
        commentaire: "",
      };
      parLabo.set(cle, plan);
    }

    const gamme = val(ligne, colonnes.gamme);
    if (gamme && !plan.gammes.includes(gamme)) plan.gammes.push(gamme);

    const seuil = val(ligne, colonnes.seuil) || val(ligne, colonnes.objectif);
    const avantage = val(ligne, colonnes.avantage) || val(ligne, colonnes.remise);
    if ((seuil || avantage) && !plan.paliers.some((p) => p.seuil === seuil && p.avantage === avantage))
      plan.paliers.push({ seuil, avantage });

    const detail = [
      val(ligne, colonnes.periode),
      gamme,
      val(ligne, colonnes.type_accord),
      val(ligne, colonnes.commentaire),
    ]
      .filter(Boolean)
      .join(" — ");
    if (detail) plan.commentaire = plan.commentaire ? `${plan.commentaire}\n${detail}` : detail;
  }

  return [...parLabo.values()].map((p) => ({
    ...p,
    paliers: p.paliers.length ? p.paliers : [{ seuil: "", avantage: "" }],
  }));
}
