import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui-kit";
import { changerAcces, envoyerReinitialisation, inviter, listerAcces } from "@/lib/admin.functions";
import { useSessionModule } from "@/components/GardeAcces";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Accès au module — Agent Trade & Gammes" },
      { name: "description", content: "Inviter des pharmaciens et gérer leurs accès au module." },
      { property: "og:title", content: "Accès au module — Agent Trade & Gammes" },
      { property: "og:description", content: "Inviter des pharmaciens et gérer leurs accès au module." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const date = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

function Admin() {
  const session = useSessionModule();
  const qc = useQueryClient();
  const lister = useServerFn(listerAcces);
  const inv = useServerFn(inviter);
  const changer = useServerFn(changerAcces);
  const reinit = useServerFn(envoyerReinitialisation);
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const q = useQuery({ queryKey: ["acces"], queryFn: () => lister(), enabled: !!session?.admin });

  if (!session?.admin)
    return <p className="py-24 text-center text-sm text-muted-foreground">Page réservée à l'administrateur.</p>;

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const r = await inv({ data: { email, nom, origine: window.location.origin } });
      toast.success(
        r.existant
          ? `${email} avait déjà un compte : accès réactivé et mail de réinitialisation envoyé.`
          : `Invitation envoyée à ${email}.`,
      );
      setEmail("");
      setNom("");
      void qc.invalidateQueries({ queryKey: ["acces"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invitation impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  async function basculer(userId: string, actif: boolean) {
    try {
      await changer({ data: { userId, actif } });
      void qc.invalidateQueries({ queryKey: ["acces"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Modification impossible.");
    }
  }

  async function motDePasse(mail: string) {
    try {
      await reinit({ data: { email: mail, origine: window.location.origin } });
      toast.success(`Mail de réinitialisation envoyé à ${mail}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible.");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Accès au module</h1>
      <Card className="mt-6 p-6">
        <h2 className="font-semibold">Inviter un pharmacien</h2>
        <form onSubmit={envoyer} className="mt-3 flex flex-wrap items-end gap-2">
          <input className="field flex-1" type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field flex-1" placeholder="Nom (facultatif)" value={nom} onChange={(e) => setNom(e.target.value)} />
          <Button type="submit" disabled={envoi}>{envoi ? "Envoi…" : "Envoyer l'invitation"}</Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          La personne reçoit un e-mail pour choisir son mot de passe.
        </p>
      </Card>
      <Card className="mt-6 overflow-x-auto p-6">
        {q.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {q.error && <p className="text-sm text-destructive">{(q.error as Error).message}</p>}
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="py-2">Nom</th><th>E-mail</th><th>Invité le</th><th>Retiré le</th><th>Accès</th><th>Mot de passe</th></tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((a) => (
              <tr key={a.user_id} className="border-t border-border">
                <td className="py-2">{a.nom || "—"}</td>
                <td>{a.email}</td>
                <td>{date(a.invite_le)}</td>
                <td>{date(a.retire_le)}</td>
                <td>
                  <Button variant={a.actif ? "secondary" : "primary"} onClick={() => void basculer(a.user_id, !a.actif)}>
                    {a.actif ? "Actif — retirer" : "Retiré — réactiver"}
                  </Button>
                </td>
                <td>
                  <Button variant="secondary" onClick={() => void motDePasse(a.email)}>
                    Mot de passe
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
