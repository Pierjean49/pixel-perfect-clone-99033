import type { SupabaseClient } from "@supabase/supabase-js";

/** À appeler dans les fonctions serveur protégées : exige un accès actif. */
export async function exigerAccesActif(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("acces_module")
    .select("actif")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.actif) throw new Error("Ton accès au module est terminé. Contacte ton formateur.");
}

export async function exigerAdmin(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Réservé à l'administrateur.");
}
