import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
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
    verifierQuotaIA();
    const media =
      data.type === "application/pdf"
        ? { type: "file", file: { filename: "plan.pdf", file_data: data.data } }
        : { type: "image_url", image_url: { url: data.data } };
    const { appelerIA } = await import("./ia.server");
    return (await appelerIA({
      schema: Schema,
      nom: "plan_pharmacie",
      system:
        "Tu es expert en merchandising de pharmacie d'officine. Tu lis un plan de pharmacie. Liste chaque emplacement visible (têtes de gondole numérotées, descentes/murs avec le nom des gammes, vitrines, comptoirs). N'invente aucun nom : recopie ce qui est écrit. Classe chaque emplacement en zone chaude (entrée, allée principale, abords des comptoirs, caisse), tiède ou froide (fond, recoins, hors flux). Réponds en français.",
      contenu: [
        {
          type: "text",
          text: `Gammes référencées dans l'officine (pour reconnaître les noms) : ${data.gammes.join(", ") || "non précisé"}.`,
        },
        media,
      ],
    })) as LecturePlan;
  });
