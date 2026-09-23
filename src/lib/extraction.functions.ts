import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";

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
  commentaire: S.describe("Détail des opérations / promotions / calendrier mensuel"),
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
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Configuration IA manquante.");
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const consigne =
      data.mode === "achat"
        ? `Extrais les conditions commerciales de la marque « ${data.marque || "inconnue"} » (achat) ET le plan trade (opérations, paliers, contreparties).`
        : "Extrais tous les plans trade du document : un plan par laboratoire (ou par accord distinct). Laisse l'objet achat avec des chaînes vides.";
    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        output: Output.object({ schema: Schema }),
        system:
          "Tu es assistant achats en pharmacie d'officine. Tu lis un accord commercial ou un plan trade de laboratoire et remplis une fiche. N'invente rien : laisse une chaîne vide ou une liste vide si l'information est absente. Nombres sans symbole (18 et non 18 %). Réponds en français.",
        prompt: `${consigne}\n\nDOCUMENT :\n${data.texte}`,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      return (await result.output) as Extraction;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("402")) throw new Error("Crédits IA épuisés.");
      if (msg.includes("429")) throw new Error("Trop de demandes, réessayez dans une minute.");
      throw new Error("La lecture automatique a échoué.");
    }
  });
