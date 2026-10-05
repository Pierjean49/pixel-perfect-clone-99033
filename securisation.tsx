import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Card, Encadre, PageHeader } from "@/components/ui-kit";
import { useForm } from "@/lib/store";
import { COUCHES_SECURITE, ETAPES_SECURISATION } from "@/data/reference";
import { downloadDoc, noteInformation, registreTraitements } from "@/lib/documents";

export const Route = createFileRoute("/securisation")({
  head: () => ({
    meta: [
      { title: "Sécurisation de l'agent | Agent Trade & Gammes" },
      {
        name: "description",
        content:
          "Rôles et droits, nom de domaine OVH, Cloudflare, emails de notification et double authentification : le parcours de sécurisation de la visio 3.",
      },
      { property: "og:title", content: "Sécurisation — Agent Trade & Gammes" },
      {
        property: "og:description",
        content: "Les quatre couches de sécurité, dans un ordre qui ne s'intervertit jamais.",
      },
    ],
  }),
  component: Securisation,
});

function Securisation() {
  const { form, update } = useForm();
  const auditFinalOk = !!form.suivi.guide["24"];
  const officine = form.identite.nom_pharmacie;
  const titulaire = form.identite.nom_titulaire;

  if (!auditFinalOk) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <PageHeader surtitre="Onglet Sécurisation" titre="Verrouillé pour l'instant" />
        <Card className="p-8 text-center">
          <p className="text-lg font-medium">
            Cet onglet s'ouvre quand la case « Audit final de construction » est cochée.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            C'est l'étape 24 du guide. Sécuriser un agent encore incomplet, c'est poser la serrure
            avant d'avoir monté la porte.
          </p>
          <div className="mt-5">
            <Link to="/guide">
              <Button>Aller au guide</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        surtitre="Onglet Sécurisation · visio 3"
        titre="Fermer l'agent, dans le bon ordre"
        intro="Comptes et droits → nom de domaine → Cloudflare → emails → double authentification. Jamais interverti : activer la MFA avant que le domaine soit stable expose à se verrouiller hors de sa propre application."
      />

      <Card className="p-5">
        <h2 className="font-display text-xl font-semibold">Prérequis</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Agent terminé et rempli avec les données réelles.</li>
          <li>Carte bancaire : domaine OVH, environ 10 à 15 € par an.</li>
          <li>Une adresse email d'administration dédiée, jamais partagée.</li>
          <li>Un smartphone et un endroit sûr pour les codes de secours.</li>
        </ul>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Couche</th>
              <th className="px-4 py-2">Rôle</th>
              <th className="px-4 py-2">Outil</th>
            </tr>
          </thead>
          <tbody>
            {COUCHES_SECURITE.map((c) => (
              <tr key={c.couche} className="border-t border-border">
                <td className="px-4 py-2 font-medium">{c.couche}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.role}</td>
                <td className="px-4 py-2">{c.outil}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Les prompts S1 (rôles et droits) et S4 (emails de notification), ainsi que l'audit de fin de
        sécurisation, sont personnalisés dans l'onglet{" "}
        <Link to="/prompts" className="font-medium text-primary underline">
          Prompts
        </Link>
        .
      </p>

      <div className="mt-6 space-y-4">
        {ETAPES_SECURISATION.map((e) => (
          <Card key={e.id} className="p-5">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                checked={!!form.suivi.securisation[e.id]}
                onChange={(ev) =>
                  update((d) => void (d.suivi.securisation[e.id] = ev.target.checked))
                }
              />
              <div>
                <h2 className="font-display text-xl font-semibold">{e.titre}</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {e.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {e.vigilance ? (
                  <Encadre type="vigilance">
                    <p>{e.vigilance}</p>
                  </Encadre>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-5">
        <h2 className="font-display text-xl font-semibold">Documents à remettre à l'équipe</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Personnalisés au nom de {officine || "ton officine"}. À traiter avant d'ouvrir l'agent à
          l'équipe : les résultats individuels et les primes constituent un dispositif de contrôle de
          l'activité des salariés.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() =>
              downloadDoc(
                "note-information-salaries",
                "Note d'information aux salariés",
                noteInformation(officine, titulaire),
              )
            }
          >
            Note d'information aux salariés (.doc)
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              downloadDoc(
                "registre-des-traitements",
                "Fiche de registre des traitements",
                registreTraitements(officine, titulaire),
              )
            }
          >
            Fiche de registre des traitements (.doc)
          </Button>
        </div>
      </Card>

      <Encadre type="vigilance">
        <p>
          L'hébergement en Europe est nécessaire, il n'est pas suffisant : finalité limitée, accès
          restreint par rôle, durée de conservation définie, inscription au registre de l'article 30
          du RGPD et information individuelle préalable de chaque salarié (art. L.1222-4 du Code du
          travail), quel que soit l'effectif. À partir de cinquante salariés, le comité social et
          économique doit en plus être informé et consulté avant la mise en service (art. L.2312-38
          du Code du travail). Fais relire ces documents par ton conseil avant diffusion.
        </p>
      </Encadre>
    </main>
  );
}
