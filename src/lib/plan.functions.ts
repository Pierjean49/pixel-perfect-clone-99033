import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { exigerAccesActif } from "@/lib/acces.server";
import { verifierQuotaIA } from "./garde-ia";

// Seuls un PDF ou une image encodés dans la requête sont acceptés : jamais une adresse web,
// que le serveur ou le fournisseur d'IA irait chercher à la place de l'appelant.
const DATA_URL = /^data:(application\/pdf|image\/(jpeg|png|webp));base64,[A-Za-z0-9+/=\s]+$/;

const Input = z
  .object({
    type: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
    data: z.string().min(40).max(3_000_000).regex(DATA_URL),
    gammes: z.array(z.string().max(200)).max(500),
  })
  .refine((d) => d.data.startsWith(`data:${d.type};base64,`), {
    message: "Le type annoncé ne correspond pas au fichier.",
  });

const Schema = z.object({
  emplacements: z.array(
    z.object({
      type: z.enum(["TG", "Descente", "Gondole", "Vitrine", "Comptoir", "Présentoir", "Autre"]),
      numero: z.string(),
      gammes: z.string().describe("Noms des gammes / marques lus sur l'emplacement, séparés par des virgules"),
      zone: z.enum(["chaude", "tiède", "froide"]),
    }),
  ),
  analyse: z.string().describe("3 à 6 phrases : zones chaudes, zones froides, pistes d'amélioration du merchandising"),
});

export type LecturePlan = z.infer<typeof Schema>;

export const lirePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    await exigerAccesActif(context.supabase, context.userId);
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Configuration IA manquante.");
    verifierQuotaIA();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const media =
      data.type === "application/pdf"
        ? ({ type: "file", filename: "plan.pdf", data: data.data.split(",").pop()!, mediaType: "application/pdf" } as const)
        : ({ type: "image", image: new URL(data.data) } as const);
    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        output: Output.object({ schema: Schema }),
        system:
          "Tu es expert en merchandising de pharmacie d'officine. Tu lis un plan de pharmacie. Liste chaque emplacement visible (têtes de gondole numérotées, descentes/murs avec le nom des gammes, vitrines, comptoirs). N'invente aucun nom : recopie ce qui est écrit. Classe chaque emplacement en zone chaude (entrée, allée principale, abords des comptoirs, caisse), tiède ou froide (fond, recoins, hors flux). Réponds en français.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Gammes référencées dans l'officine (pour reconnaître les noms) : ${data.gammes.join(", ") || "non précisé"}.`,
              },
              media,
            ],
          },
        ],
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
      return (await result.output) as LecturePlan;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("402")) throw new Error("Crédits IA épuisés.");
      if (msg.includes("429")) throw new Error("Trop de demandes, réessaie dans une minute.");
      throw new Error("La lecture du plan a échoué.");
    }
  });
