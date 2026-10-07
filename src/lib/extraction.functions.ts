import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { exigerAccesActif } from "@/lib/acces.server";
import { verifierQuotaIA } from "./garde-ia";

const Input = z.object({
  texte: z.string().min(1).max(120000),
  marque: z.string().max(200),
  mode: z.enum(["achat", "trade"]),
});

const S = z.string();
const Plan = z.object({
  laboratoire: S,
  gammes: z.array(S),
  type_accord: S,
  debut: S.describe("AAAA-MM-JJ ou vide"),
  fin: S.describe("AAAA-MM-JJ ou vide"),
  interlocuteur: S,
  objectif_achat: S,
  paliers: z.array(z.object({ seuil: S, avantage: S })),
  remise_facture: S,
  rfa: S,
  ug: S,
  budget_plv: S,
  budget_formation: S,
  contreparties: z.array(S),
  operations: z
    .array(
      z.object({
        mois: S.describe("Mois ou période (ex. Mars 2026, Janv.–Août)"),
        produits: S.describe("Produits / gammes concernés"),
        operation: S.describe("Nom de l'opération / promotion / animation"),
        fonctionnement: S.describe("Mécanique : remise, produits, conditions, volumes"),
        contrepartie: S.describe("Engagement de la pharmacie : TG, vitrine, écran, IC…"),
      }),
    )
    .describe("Calendrier des opérations trade, une ligne par opération et par mois"),
  commentaire: S.describe("Autres informations utiles non couvertes ailleurs"),
});

const Schema = z.object({
  achat: z.object({
    laboratoire: S,
    code_client: S,
    representant_prenom: S,
    representant_nom: S,
    representant_tel: S,
    representant_mail: S,
    dr_prenom: S,
    dr_nom: S,
    dr_tel: S,
    dr_mail: S,
    labo_tel: S,
    labo_mail: S,
    remise_base: S.describe("pourcentage, chiffre seul"),
    remises_marches: z.array(z.object({ marche: S, taux: S, condition: S })),
    franco: S.describe("montant en euros, chiffre seul"),
    perimes_modalites: z.array(
      z.enum(["Avoir", "Abattement", "Avoir en UG", "Avoir sur application", "Pas de reprise"]),
    ),
    perimes_abattement_pct: S,
    rfa: S.describe("pourcentage, chiffre seul"),
    rfa_versee_par: z.enum(["", "Groupement", "En direct"]),
    frequence_commande: S,
    commentaire: S.describe("Autres conditions utiles (délais de paiement, paliers…)"),
  }),
  plans: z.array(Plan),
});

export type Extraction = z.infer<typeof Schema>;

export const extraireDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    await exigerAccesActif(context.supabase, context.userId);
    verifierQuotaIA();
    const consigne =
      data.mode === "achat"
        ? `Extrais les conditions commerciales de la marque « ${data.marque || "inconnue"} » (achat) ET le plan trade (opérations, paliers, contreparties).`
        : "Extrais tous les plans trade du document : un plan par laboratoire (ou par accord distinct). Laisse l'objet achat avec des chaînes vides." + (data.marque ? ` ${data.marque}.` : "");
    const { appelerIA } = await import("./ia.server");
    return (await appelerIA({
      schema: Schema,
      nom: "extraction",
      system:
        "Tu es assistant achats en pharmacie d'officine. Tu lis un accord commercial ou un plan trade de laboratoire et remplis une fiche. N'invente rien : laisse une chaîne vide ou une liste vide si l'information est absente. Nombres sans symbole (18 et non 18 %). Réponds en français.",
      contenu: `${consigne}\n\nDOCUMENT :\n${data.texte}`,
    })) as Extraction;
  });
