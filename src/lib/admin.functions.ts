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
    const { data: inv, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${data.origine}/definir-mot-de-passe`,
    });
    if (error) throw new Error(error.message);
    const { error: e2 } = await supabaseAdmin.from("acces_module").upsert({
      user_id: inv.user.id,
      email,
      nom: data.nom,
      actif: true,
      invite_le: new Date().toISOString(),
      retire_le: null,
    });
    if (e2) throw new Error(e2.message);
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
