import { supabase } from "@/integrations/supabase/client";

export const MESSAGE_FIN = "Ton accès au module est terminé. Contacte ton formateur.";
export const PAGES_PUBLIQUES = ["/connexion", "/definir-mot-de-passe"];

export type EtatAcces =
  | { statut: "ok"; email: string; admin: boolean }
  | { statut: "deconnecte" }
  | { statut: "termine" };

/** Vérifie le compte (revalidé auprès du serveur) et l'accès actif. */
export async function verifierAcces(): Promise<EtatAcces> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { statut: "deconnecte" };
  const uid = data.user.id;
  const [{ data: acces }, { data: roles }] = await Promise.all([
    supabase.from("acces_module").select("actif").eq("user_id", uid).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", uid),
  ]);
  if (!acces?.actif) {
    await supabase.auth.signOut();
    return { statut: "termine" };
  }
  return {
    statut: "ok",
    email: data.user.email ?? "",
    admin: (roles ?? []).some((r) => r.role === "admin"),
  };
}
