import { promptTemplates, type PromptTemplate } from "@/data/promptTemplates";
import { EXTENSIONS } from "@/data/reference";
import type { FormState } from "./types";

const clean = (v: string | undefined | null) => (v ?? "").toString().trim();

const joinList = (arr: string[]) => arr.filter(Boolean).join(" · ");

function nomComplet(prenomNom: string) {
  return clean(prenomNom);
}

export function buildVariables(f: FormState): Record<string, string> {
  const id = f.identite;
  const gammesDermo = f.gammes.filter((g) => g.pole === "Dermo-cosmétique");
  const pilote = f.gammes.find((g) => g.pilote) ?? gammesDermo.find((g) => g.statut === "Gamme pilier") ?? gammesDermo[0];

  const listeGammesDermo = gammesDermo
    .filter((g) => !pilote || g.id !== pilote.id)
    .map((g) =>
      joinList([
        `- ${g.nom}`,
        clean(g.laboratoire) && `laboratoire ${g.laboratoire}`,
        clean(g.statut),
        clean(g.emplacement),
        clean(g.lineaire_ml) && `${g.lineaire_ml} ml`,
        clean(g.facings) && `${g.facings} facings`,
        clean(g.referent) && `référent ${g.referent}`,
      ]),
    )
    .join("\n");

  const autresPoles = f.poles.filter((p) => p.nom !== "Dermo-cosmétique");
  const listePolesAvecParametres = autresPoles
    .map((p) =>
      joinList([
        `- ${p.nom}`,
        clean(p.couleur) && `couleur ${p.couleur}`,
        clean(p.responsable) && `responsable ${p.responsable}`,
        clean(p.poids) && `poids visé ${p.poids} % du CA para`,
        clean(p.objectif_progression) && `objectif +${p.objectif_progression} % sur 12 mois`,
        clean(p.priorite) && `priorité ${p.priorite}`,
        (p.sous_poles ?? []).filter(Boolean).length > 0 &&
          `sous-pôles : ${(p.sous_poles ?? []).filter(Boolean).join(", ")}`,
      ]),
    )
    .join("\n");

  const listeGammesParPole = autresPoles
    .map((p) => {
      const gs = f.gammes.filter((g) => g.pole === p.nom);
      if (!gs.length) return "";
      return `${p.nom} :\n${gs
        .map((g) =>
          joinList([
            `  - ${g.nom}`,
            clean(g.laboratoire),
            clean(g.statut),
            clean(g.emplacement),
            clean(g.referent) && `référent ${g.referent}`,
          ]),
        )
        .join("\n")}`;
    })
    .filter(Boolean)
    .join("\n");

  const listePlansTrade = f.plans
    .map((p) => {
      const paliers = p.paliers
        .filter((x) => clean(x.seuil) || clean(x.avantage))
        .map((x) => `${clean(x.seuil)} → ${clean(x.avantage)}`)
        .join(" ; ");
      return [
        joinList([
          `- ${clean(p.laboratoire)}`,
          p.gammes.length ? `gammes : ${p.gammes.join(", ")}` : "",
          clean(p.type_accord),
          clean(p.debut) && clean(p.fin) ? `du ${p.debut} au ${p.fin}` : "",
          clean(p.interlocuteur) && `interlocuteur ${p.interlocuteur}`,
          clean(p.objectif_achat) && `objectif d'achat ${p.objectif_achat} €`,
        ]),
        paliers && `  Paliers : ${paliers}`,
        joinList([
          clean(p.remise_facture) && `  Remise sur facture ${p.remise_facture} %`,
          clean(p.rfa) && `RFA ${p.rfa} %`,
          clean(p.ug) && `UG ${p.ug}`,
          clean(p.budget_plv) && `budget PLV ${p.budget_plv} €`,
          clean(p.budget_formation) && `budget formation ${p.budget_formation}`,
        ]),
        p.contreparties.length ? `  Contreparties : ${p.contreparties.join(" · ")}` : "",
        joinList([
          clean(p.date_revue) && `  Revue le ${p.date_revue}`,
          clean(p.convention) && `convention déclarée à l'Ordre : ${p.convention}`,
        ]),
        clean(p.commentaire) && `  ${p.commentaire}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const listeEquipe = f.equipe
    .map((c) =>
      joinList([
        `- ${clean(c.prenom)} ${clean(c.nom)}`,
        clean(c.role),
        clean(c.pole) && `pôle ${c.pole}`,
        c.gammes_referentes.length ? `gammes référentes : ${c.gammes_referentes.join(", ")}` : "",
        clean(c.responsabilite) && c.responsabilite !== "Aucune" ? `responsabilité trade : ${c.responsabilite}` : "",
        clean(c.heures_trade) && `${c.heures_trade} h/semaine dédiées au trade`,
        clean(c.date_entree) && `entré(e) le ${c.date_entree}`,
      ]),
    )
    .join("\n");

  const paliersPrime = f.primes.paliers
    .filter((p) => clean(p.seuil) || clean(p.avantage))
    .map((p) => `- ${clean(p.seuil)} → ${clean(p.avantage)}`)
    .join("\n");

  const blocChallenges =
    f.primes.challenges === "Oui"
      ? joinList([
          "Challenges internes",
          clean(f.primes.challenge_theme),
          clean(f.primes.challenge_duree) && `durée ${f.primes.challenge_duree}`,
          f.primes.recompenses.length ? `récompenses : ${f.primes.recompenses.join(", ")}` : "",
        ])
      : "";

  const tableauSaisonnalite = f.objectifs.saisonnalite
    .filter((m) => clean(m.poles))
    .map((m) => `- ${m.mois} : ${m.poles}`)
    .join("\n");

  const formationsLaboParGamme = f.gammes
    .filter((g) => clean(g.formation_labo) && g.formation_labo !== "Non")
    .map((g) => `- ${g.nom} : formation labo ${g.formation_labo.toLowerCase()}`)
    .join("\n");

  return {
    nom_pharmacie: clean(id.nom_pharmacie),
    ville: clean(id.ville),
    nom_titulaire: [clean(id.prenom_titulaire), clean(id.nom_titulaire)].filter(Boolean).join(" "),
    nb_titulaires: clean(id.nb_titulaires),
    cotitulaires: clean(id.cotitulaires),
    groupement: clean(id.groupement),
    lgo: clean(id.lgo),
    ca_annuel: clean(id.ca_annuel) ? `${id.ca_annuel} €` : "",
    part_ca_para: clean(id.part_ca_para),
    surface: clean(id.surface),
    agencement: [
      clean(id.nb_descentes) && `${id.nb_descentes} descentes murales`,
      clean(id.nb_gondoles) && `${id.nb_gondoles} gondoles`,
      clean(id.nb_tg) && `${id.nb_tg} têtes de gondole`,
      clean(id.nb_comptoirs_ordonnance) && `${id.nb_comptoirs_ordonnance} comptoirs ordonnance`,
      clean(id.nb_comptoirs_para) && `${id.nb_comptoirs_para} comptoirs para`,
      clean(id.comptoir_accueil) === "Oui" && "un comptoir d'accueil",
      clean(id.nb_salles_confidentialite) && `${id.nb_salles_confidentialite} salles de confidentialité`,
      clean(id.nb_ecrans_vente) && `${id.nb_ecrans_vente} écrans en surface de vente`,
      clean(id.nb_ecrans_vitrine) && `${id.nb_ecrans_vitrine} écrans en vitrine`,
    ]
      .filter(Boolean)
      .join(", "),
    nb_vitrines: clean(id.nb_vitrines),
    autres_infos: clean(id.autres_infos),
    couleur_primaire: "#0E7A5F",
    positionnement_prix: clean(f.positionnement.prix),
    services_proposes: joinList(f.positionnement.services),
    axes_differenciation: joinList(f.positionnement.axes),
    typologie_clientele: clean(f.positionnement.typologie_clientele),
    force_distinctive: clean(f.positionnement.force_distinctive),
    objectif_ca_annuel: clean(f.objectifs.objectif_ca_annuel) ? `${f.objectifs.objectif_ca_annuel} €` : "",
    objectif_marge_global: clean(f.objectifs.objectif_marge_global) ? `${f.objectifs.objectif_marge_global} %` : "",
    indicateurs_suivis: joinList(f.objectifs.indicateurs),
    periodicite_pilotage: clean(f.objectifs.periodicite),
    nb_mois_historique: clean(f.options.nb_mois_historique) || "24",
    mode_import: clean(f.options.mode_import),
    responsable_dermo: nomComplet(f.poles.find((p) => p.nom === "Dermo-cosmétique")?.responsable ?? ""),
    gamme_pilote: clean(pilote?.nom),
    labo_pilote: clean(pilote?.laboratoire),
    statut_gamme_pilote: clean(pilote?.statut),
    referent_gamme_pilote: clean(pilote?.referent),
    liste_gammes_dermo: listeGammesDermo,
    liste_poles_avec_parametres: listePolesAvecParametres,
    liste_gammes_par_pole: listeGammesParPole,
    liste_plans_trade: listePlansTrade,
    liste_equipe: listeEquipe,
    dispositif_prime: clean(f.primes.dispositif),
    assiette_prime: clean(f.primes.assiette),
    perimetre_prime: clean(f.primes.perimetre),
    periodicite_prime: clean(f.primes.periodicite),
    paliers_prime: paliersPrime,
    plafond_prime: clean(f.primes.plafond) ? `${f.primes.plafond} € par période` : "",
    repartition_prime: clean(f.primes.part_collective)
      ? `${f.primes.part_collective} % collectif / ${100 - Number(f.primes.part_collective || 0)} % individuel`
      : "",
    bloc_challenges: blocChallenges,
    criteres_qualitatifs: joinList(f.primes.criteres),
    validateur_prime: clean(f.primes.validateur),
    emplacement_vitrines: joinList(f.merch.emplacement_vitrines),
    frequence_vitrine: clean(f.merch.frequence_vitrine),
    nb_tg: clean(f.merch.nb_tg),
    zones_chaudes: clean(f.merch.zones_chaudes),
    types_animation: joinList(f.merch.types_animation),
    plv_disponibles: joinList(f.merch.plv),
    responsable_merch: clean(f.merch.poseur),
    archivage_photos: clean(f.merch.archivage_photos),
    tableau_saisonnalite: tableauSaisonnalite,
    formations_labo_par_gamme: formationsLaboParGamme,
  };
}

/**
 * Interpolation stricte :
 * - \{{x}} (méta-variable destinée à l'agent construit) est restituée telle quelle ;
 * - un segment « · » dont la variable est vide disparaît, la ligne reste ;
 * - une ligne dont tous les segments sont vides disparaît ;
 * - jamais de {{...}}, de « undefined » ni de « null » dans le résultat.
 */
export function interpolate(template: string, vars: Record<string, string>): string {
  const ESC = "\u0000ESC\u0000";
  let text = template.replace(/\\\{\{([^}]+)\}\}/g, (_m, name) => `${ESC}${name}${ESC}`);

  const lines = text.split("\n");
  const out: string[] = [];

  for (const rawLine of lines) {
    if (!/\{\{[a-z_0-9]+\}\}/.test(rawLine)) {
      out.push(rawLine);
      continue;
    }

    // Une ligne « liste » : la variable est seule et multi-lignes.
    const solo = rawLine.match(/^(\s*)\{\{([a-z_0-9]+)\}\}\s*$/);
    if (solo) {
      const value = vars[solo[2]] ?? "";
      if (value.trim()) out.push(value);
      continue;
    }

    const bullet = rawLine.match(/^(\s*[-•]?\s*)(.*)$/);
    const prefix = bullet ? bullet[1] : "";
    const body = bullet ? bullet[2] : rawLine;

    const segments = body.split(" · ");
    const kept = segments
      .map((seg) => {
        const names = [...seg.matchAll(/\{\{([a-z_0-9]+)\}\}/g)].map((m) => m[1]);
        if (!names.length) return seg;
        const missing = names.some((n) => !clean(vars[n]));
        if (missing) return null;
        return seg.replace(/\{\{([a-z_0-9]+)\}\}/g, (_m, n) => clean(vars[n]));
      })
      .filter((s): s is string => s !== null && s.trim() !== "");

    if (!kept.length) continue;
    out.push(`${prefix}${kept.join(" · ")}`.replace(/\s+$/, ""));
  }

  return out
    .join("\n")
    .replace(new RegExp(`${ESC}([^\u0000]+)${ESC}`, "g"), "{{$1}}")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type GeneratedPrompt = {
  id: string;
  numero: string;
  title: string;
  kind: PromptTemplate["kind"];
  text: string;
  words: number;
  unlockedBy: string | null;
  unlockLabel: string;
};

const UNLOCK: Record<string, { by: string | null; label: string }> = {
  P1: { by: null, label: "" },
  V1: { by: "P1", label: "À utiliser après avoir collé le Prompt maître." },
  P2: { by: "V1", label: "À utiliser après validation de l'audit V1 (étape 12 du guide)." },
  V2: { by: "P2", label: "À utiliser après avoir collé le Prompt 2." },
  P3: { by: "V2", label: "À utiliser après validation de l'audit V2 (étape 15 du guide)." },
  V3: { by: "P3", label: "À utiliser après avoir collé le Prompt 3." },
  P4: { by: "V3", label: "À utiliser après validation de l'audit V3 (étape 16 du guide)." },
  V4: { by: "P4", label: "À utiliser après avoir collé le Prompt 4." },
  P5: { by: "V4", label: "À utiliser après validation de l'étape précédente." },
  P6: { by: "P5", label: "À utiliser après validation de l'étape précédente." },
  P7: { by: "P6", label: "À utiliser après validation de l'étape précédente." },
  P8: { by: "P7", label: "À utiliser après validation de l'étape précédente." },
  AF: { by: "P8", label: "À utiliser après validation du Prompt 8." },
  S1: { by: "AF", label: "Sécurisation : après l'audit final de construction." },
  S4: { by: "S1", label: "Sécurisation : après les rôles et le nom de domaine." },
  SAUDIT: { by: "S4", label: "Sécurisation : après l'activation de la MFA." },
};

export function generatePrompts(f: FormState): GeneratedPrompt[] {
  const vars = buildVariables(f);
  const base = promptTemplates.map((t) => {
    const text = interpolate(t.template, vars);
    const unlock = UNLOCK[t.id] ?? { by: null, label: "" };
    return {
      id: t.id,
      numero: t.id,
      title: t.title,
      kind: t.kind,
      text,
      words: text.split(/\s+/).filter(Boolean).length,
      unlockedBy: unlock.by,
      unlockLabel: unlock.label,
    };
  });

  const extensions = EXTENSIONS.filter((e) => f.options.extensions.includes(e.cle)).map((e) => {
    const text = interpolate(
      `${e.texte}\n\nNe touche à rien d'autre : cette extension s'ajoute à l'agent existant de la {{nom_pharmacie}} sans modifier les briques précédentes. Aucune donnée patient, aucune donnée de santé.`,
      vars,
    );
    return {
      id: e.id,
      numero: e.id,
      title: e.titre,
      kind: "extension" as const,
      text,
      words: text.split(/\s+/).filter(Boolean).length,
      unlockedBy: "P8",
      unlockLabel: "Extension : utilisable à tout moment après la brique 8.",
    };
  });

  const order = ["P1", "V1", "P2", "V2", "P3", "V3", "P4", "V4", "P5", "P6", "P7", "P8", "AF"];
  const construction = order.map((k) => base.find((b) => b.id === k)!).filter(Boolean);
  const securisation = base.filter((b) => b.kind === "securisation");
  return [...construction, ...extensions, ...securisation];
}

export function apercuPromptMaitre(f: FormState): string {
  const t = promptTemplates.find((x) => x.id === "P1");
  if (!t) return "";
  return interpolate(t.template, buildVariables(f));
}

export function variablesNonResolues(prompts: GeneratedPrompt[]): string[] {
  const found = new Set<string>();
  for (const p of prompts) {
    for (const m of p.text.matchAll(/\{\{([a-z_0-9]+)\}\}/g)) {
      // les méta-variables destinées à l'agent construit sont attendues
      if (["labo", "date_fin"].includes(m[1])) continue;
      found.add(`${p.numero} · ${m[1]}`);
    }
    if (/undefined|null/.test(p.text)) found.add(`${p.numero} · valeur vide non nettoyée`);
  }
  return [...found];
}
