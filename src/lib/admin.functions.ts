import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { exigerAccesActif, exigerAdmin } from "@/lib/acces.server";

export const listerAcces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigerAccesActif(context.supabase, context.userId);
    await exigerAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("acces_module")
      .select("user_id, email, nom, actif, invite_le, retire_le")
      .order("invite_le", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const inviter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email().max(255), nom: z.string().max(120), origine: z.string().url() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await exigerAccesActif(context.supabase, context.userId);
    await exigerAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const redirectTo = `${data.origine}/definir-mot-de-passe`;
    let userId: string;
    let existant = false;
    const { data: inv, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (!error) userId = inv.user.id;
    else {
      // Compte déjà existant : on retrouve son identifiant puis on réactive l'accès.
      const trouve = await trouverUtilisateur(supabaseAdmin, email);
      if (!trouve) throw new Error(error.message);
      userId = trouve;
      existant = true;
    }
    const { error: e2 } = await supabaseAdmin.from("acces_module").upsert({
      user_id: userId,
      email,
      nom: data.nom,
      actif: true,
      invite_le: new Date().toISOString(),
      retire_le: null,
    });
    if (e2) throw new Error(e2.message);
    if (existant) {
      const { error: e3 } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
      if (e3) throw new Error(e3.message);
    }
    return { ok: true, existant };
  });

export const envoyerReinitialisation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().email().max(255), origine: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await exigerAccesActif(context.supabase, context.userId);
    await exigerAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email.trim().toLowerCase(), {
      redirectTo: `${data.origine}/definir-mot-de-passe`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const changerAcces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), actif: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await exigerAccesActif(context.supabase, context.userId);
    await exigerAdmin(context.supabase, context.userId);
    if (data.userId === context.userId && !data.actif) throw new Error("Tu ne peux pas retirer ton propre accès.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("acces_module")
      .update({ actif: data.actif, retire_le: data.actif ? null : new Date().toISOString() })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function trouverUtilisateur(admin: any, email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    const u = data.users.find((x: { email?: string }) => x.email?.toLowerCase() === email);
    if (u) return u.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}
