import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, Encadre, PageHeader, Progress } from "@/components/ui-kit";
import { useForm } from "@/lib/store";
import { AUDIT_ECHOUE, ETAPES_GUIDE, REGLES_PEDAGOGIQUES } from "@/data/reference";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide en 24 étapes | Agent Trade & Gammes" },
      {
        name: "description",
        content:
          "Les 24 étapes de construction de l'agent, de la création du projet Lovable à l'audit final, avec cases à cocher persistantes et barre de progression.",
      },
      { property: "og:title", content: "Guide en 24 étapes — Agent Trade & Gammes" },
      {
        property: "og:description",
        content: "Marche à suivre, durées indicatives et points de vigilance, étape par étape.",
      },
    ],
  }),
  component: Guide;
});

function Guide() {
  const { form, update } = useForm();
  const coches = ETAPES_GUIDE.filter((e) => form.suivi.guide[String(e.n)]).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        surtitre="Onglet Guide"
        titre="Les 24 étapes de construction"
        intro="Coche au fur et à mesure : ta progression est enregistrée dans ce navigateur et déverrouille les prompts de l'onglet précédent."
      />

      <Card className="p-5">
        <Progress value={(coches / ETAPES_GUIDE.length) * 100} label={`${coches} / 24 étapes validées`} />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => window.print()}>
            Imprimer le guide complet
          </Button>
        </div>
      </Card>

      <div className="mt-6 space-y-2">
        {REGLES_PEDAGOGIQUES.map((r) => (
          <Encadre key={r} type="retenir">
            <p>{r}</p>
          </Encadre>
        ))}
      </div>

      <ol className="mt-8 space-y-3">
        {ETAPES_GUIDE.map((e) => {
          const coche = !!form.suivi.guide[String(e.n)];
          return (
            <li key={e.n}>
              <Card className={`p-4 ${coche ? "border-l-4" : ""}`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                    checked={coche}
                    onChange={(ev) =>
                      update((d) => void (d.suivi.guide[String(e.n)] = ev.target.checked))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      Étape {e.n} · {e.duree}
                    </p>
                    <p className="font-display text-lg font-semibold">{e.titre}</p>
                    {e.note ? <p className="mt-1 text-sm text-muted-foreground">{e.note}</p> : null}
                    {e.audit ? (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-[var(--color-warning)]">
                          Que faire si l'audit échoue ?
                        </summary>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                          {AUDIT_ECHOUE.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ol>
                      </details>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      <Encadre type="analogie">
        <p>
          Un audit, c'est le contrôle du linéaire après implantation : tu recomptes les facings avant
          d'attaquer la travée suivante, parce qu'un décalage de dix centimètres au début devient un
          mètre à la fin du rayon.
        </p>
      </Encadre>

      <Encadre type="questions">
        <p>1. Pourquoi ne faut-il jamais modifier un prompt du module avant de le coller ?</p>
        <p>2. Que fais-tu si le même point d'audit échoue deux fois de suite ?</p>
      </Encadre>
    </main>
  );
}
