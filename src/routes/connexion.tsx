import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { MESSAGE_FIN, verifierAcces } from "@/lib/acces";

export const Route = createFileRoute("/connexion")({
  validateSearch: (s: Record<string, unknown>): { fin?: number } =>
    s["fin"] ? { fin: 1 } : {},
  head: () => ({
    meta: [
      { title: "Connexion — Agent Trade & Gammes" },
      { name: "description", content: "Connexion au module de formation Agent Trade & Gammes." },
      { property: "og:title", content: "Connexion — Agent Trade & Gammes" },
      { property: "og:description", content: "Connexion au module de formation Agent Trade & Gammes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  const { fin } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [oubli, setOubli] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(fin ? MESSAGE_FIN : "");

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: mdp });
    if (error) {
      setErreur("E-mail ou mot de passe incorrect.");
      setEnvoi(false);
      return;
    }
    const acces = await verifierAcces();
    setEnvoi(false);
    if (acces.statut !== "ok") return setErreur(MESSAGE_FIN);
    void navigate({ to: "/" });
  }

  async function reinitialiser(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/definir-mot-de-passe`,
    });
    setEnvoi(false);
    toast.success("Si ce compte existe, un e-mail de réinitialisation vient d'être envoyé.");
    setOubli(false);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card className="p-6">
        <h1 className="font-display text-2xl font-semibold">
          {oubli ? "Mot de passe oublié" : "Connexion"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {oubli
            ? "Indique ton e-mail : tu recevras un lien pour choisir un nouveau mot de passe."
            : "Accès réservé aux pharmaciens invités par leur formateur."}
        </p>
        {erreur && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {erreur}
          </p>
        )}
        <form onSubmit={oubli ? reinitialiser : connecter} className="mt-4 space-y-3">
          <label className="block text-sm">
            E-mail
            <input
              className="field mt-1"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {!oubli && (
            <label className="block text-sm">
              Mot de passe
              <input
                className="field mt-1"
                type="password"
                required
                autoComplete="current-password"
                value={mdp}
                onChange={(e) => setMdp(e.target.value)}
              />
            </label>
          )}
          <Button type="submit" disabled={envoi} className="w-full">
            {envoi ? "Un instant…" : oubli ? "Envoyer le lien" : "Se connecter"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-3 text-sm text-primary underline"
          onClick={() => (setOubli(!oubli), setErreur(""))}
        >
          {oubli ? "Retour à la connexion" : "Mot de passe oublié ?"}
        </button>
      </Card>
    </main>
  );
}
