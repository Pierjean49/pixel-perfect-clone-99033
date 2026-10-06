import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/definir-mot-de-passe")({
  head: () => ({
    meta: [
      { title: "Choisir mon mot de passe — Agent Trade & Gammes" },
      { name: "description", content: "Définis le mot de passe de ton accès au module." },
      { property: "og:title", content: "Choisir mon mot de passe — Agent Trade & Gammes" },
      { property: "og:description", content: "Définis le mot de passe de ton accès au module." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DefinirMotDePasse,
});

function DefinirMotDePasse() {
  const navigate = useNavigate();
  const [session, setSession] = useState<boolean | null>(null);
  const [mdp, setMdp] = useState("");
  const [mdp2, setMdp2] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    // Le lien du mail ouvre une session temporaire (invitation ou réinitialisation).
    const { data } = supabase.auth.onAuthStateChange((_e, s) => s && setSession(true));
    void supabase.auth.getSession().then(({ data: d }) => {
      if (d.session) setSession(true);
      else setTimeout(() => setSession((v) => v ?? false), 2500);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (mdp.length < 8) return setErreur("8 caractères minimum.");
    if (mdp !== mdp2) return setErreur("Les deux mots de passe ne correspondent pas.");
    setEnvoi(true);
    const { error } = await supabase.auth.updateUser({ password: mdp });
    setEnvoi(false);
    if (error) return setErreur("Ce mot de passe est refusé (trop simple ou déjà divulgué). Choisis-en un autre.");
    toast.success("Mot de passe enregistré.");
    void navigate({ to: "/" });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card className="p-6">
        <h1 className="font-display text-2xl font-semibold">Choisir mon mot de passe</h1>
        {session === null && <p className="mt-3 text-sm text-muted-foreground">Vérification du lien…</p>}
        {session === false && (
          <p className="mt-3 text-sm text-muted-foreground">
            Ce lien n'est plus valable. Demande un nouveau lien depuis « Mot de passe oublié » sur la
            page de connexion.
          </p>
        )}
        {session && (
          <form onSubmit={valider} className="mt-4 space-y-3">
            {erreur && <p className="text-sm text-destructive">{erreur}</p>}
            <label className="block text-sm">
              Nouveau mot de passe
              <input className="field mt-1" type="password" autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} />
            </label>
            <label className="block text-sm">
              Confirmer
              <input className="field mt-1" type="password" autoComplete="new-password" value={mdp2} onChange={(e) => setMdp2(e.target.value)} />
            </label>
            <Button type="submit" disabled={envoi} className="w-full">
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
