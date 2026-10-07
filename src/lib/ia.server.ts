import { z } from "zod/v4";

/**
 * Appel direct (fetch) au service d'IA avec réponse structurée.
 * Pas de SDK : les SDK IA embarquent des modules Node qui font planter le site publié.
 */
export async function appelerIA<T extends z.ZodType>(opts: {
  schema: T;
  nom: string;
  system: string;
  contenu: string | Array<Record<string, unknown>>;
}): Promise<z.infer<T>> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Configuration IA manquante.");
  const { $schema: _ignore, ...schema } = z.toJSONSchema(opts.schema) as Record<string, unknown>;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      reasoning_effort: "low",
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.contenu },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: opts.nom, strict: true, schema },
      },
    }),
  });
  if (res.status === 402) throw new Error("Crédits IA épuisés.");
  if (res.status === 429) throw new Error("Trop de demandes, réessaie dans une minute.");
  if (!res.ok) {
    console.error("IA", res.status, (await res.text()).slice(0, 500));
    throw new Error("La lecture automatique a échoué.");
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const texte = json.choices?.[0]?.message?.content ?? "";
  try {
    return opts.schema.parse(JSON.parse(texte));
  } catch {
    throw new Error("La lecture automatique a échoué.");
  }
}
