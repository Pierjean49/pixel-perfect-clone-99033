import type { Extraction } from "./extraction.functions";
import { uid, type AchatGamme, type ImportPlan, type PlanTrade } from "./types";

export function texteDocuments(docs: ImportPlan[]): string {
  return docs
    .map((d) => {
      const tableau = d.lignes.length ? d.lignes.map((l) => l.join(" | ")).join("\n") : "";
      return `=== ${d.nom_fichier} ===\n${d.texte || tableau}`;
    })
    .join("\n\n")
    .slice(0, 120000);
}

/** Remplit uniquement les champs vides : ne remplace jamais une saisie existante. */
export function remplirAchat(a: AchatGamme, x: Extraction["achat"]): number {
  let n = 0;
  const champs = [
    "code_client", "representant_prenom", "representant_nom", "representant_tel",
    "representant_mail", "dr_prenom", "dr_nom", "dr_tel", "dr_mail", "labo_tel", "labo_mail",
    "remise_base", "franco", "perimes_abattement_pct", "rfa", "rfa_versee_par",
    "frequence_commande",
  ] as const;
  for (const c of champs) {
    const v = (x[c] ?? "").trim();
    if (v && !(a[c] ?? "").trim()) {
      a[c] = v;
      n++;
    }
  }
  if (x.commentaire.trim() && !(a.commentaire ?? "").trim()) {
    a.commentaire = x.commentaire.trim();
    n++;
  }
  a.remises_marches ??= [];
  for (const r of x.remises_marches) {
    if (!r.marche.trim()) continue;
    if (a.remises_marches.some((m) => m.marche.toLowerCase() === r.marche.toLowerCase() && m.taux === r.taux)) continue;
    a.remises_marches.push({ id: uid(), ...r });
    n++;
  }
  a.perimes_modalites ??= [];
  for (const m of x.perimes_modalites) {
    if (!a.perimes_modalites.includes(m)) {
      a.perimes_modalites.push(m);
      n++;
    }
  }
  return n;
}

/** Complète un plan existant : champs vides seulement, opérations ajoutées. */
export function completerPlan(p: PlanTrade, x: Extraction["plans"][number]): number {
  let n = 0;
  const champs = [
    "type_accord", "debut", "fin", "interlocuteur", "objectif_achat", "remise_facture",
    "rfa", "ug", "budget_plv", "budget_formation",
  ] as const;
  for (const c of champs) {
    const v = (x[c] ?? "").trim();
    if (v && !(p[c] ?? "").trim()) {
      p[c] = v;
      n++;
    }
  }
  for (const c of x.contreparties) if (!p.contreparties.includes(c)) (p.contreparties.push(c), n++);
  const palVides = p.paliers.every((q) => !q.seuil && !q.avantage);
  if (palVides && x.paliers.length) (p.paliers = x.paliers, n++);
  p.operations ??= [];
  for (const o of x.operations) {
    if (p.operations.some((q) => q.mois === o.mois && q.operation === o.operation)) continue;
    p.operations.push({ id: uid(), ...o });
    n++;
  }
  if (x.commentaire.trim() && !p.commentaire.trim()) (p.commentaire = x.commentaire.trim(), n++);
  return n;
}

export function plansDepuisExtraction(x: Extraction, marque?: string): PlanTrade[] {
  return x.plans.map((p) => ({
    ...p,
    id: uid(),
    operations: p.operations.map((o) => ({ id: uid(), ...o })),
    gammes: p.gammes.length ? p.gammes : marque ? [marque] : [],
    date_revue: "",
    convention: "",
    commentaire: `${p.commentaire}${p.commentaire ? "\n" : ""}(Pré-rempli depuis le document — à vérifier)`,
  }));
}
