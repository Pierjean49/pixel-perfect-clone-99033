import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "@/lib/store";
import { demoForm } from "@/data/demo";
import { Button, Card, Encadre, PageHeader, Progress } from "@/components/ui-kit";
import { ETAPES_GUIDE } from "@/data/reference";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Module Formation — Agent Trade & Gammes | Officine" },
      {
        name: "description",
        content:
          "Parcours en 3 visios pour écrire le cahier des charges de votre Agent Trade & Gammes : formulaire, prompts prêts à coller, guide en 24 étapes et sécurisation.",
      },
      { property: "og:title", content: "Module Formation — Agent Trade & Gammes" },
      {
        property: "og:description",
        content:
          "Le module qui transforme les réponses du pharmacien en prompts prêts à coller dans Lovable.",
      },
    ],
  }),
  component: Accueil,
});

const VISIOS = [
  {
    n: "Visio 1",
    titre: "Cadrage, méthode et remplissage du formulaire",
    texte:
      "Comprendre ce qu'est un agent de pilotage commercial, la méthode « une brique = une demande », puis remplir les dix blocs du formulaire avec les données de ton officine.",
  },
  {
    n: "Visio 2",
    titre: "Construction brique par brique",
    texte:
      "Coller les prompts dans l'ordre, auditer après chaque brique, publier et nommer la version. Environ quatre heures, pauses comprises.",
  },
  {
    n: "Visio 3",
    titre: "Sécurisation",
    texte:
      "Rôles et droits, nom de domaine, Cloudflare, emails de notification, double authentification. Dans cet ordre, jamais interverti.",
  },
];

function Accueil() {
  const { form, hydrated, backupAt, loadDemo, restoreBackup } = useForm();

  const champsCles = [
    form.identite.nom_pharmacie,
    form.identite.nom_titulaire,
    form.poles.length > 1 ? "ok" : "",
    form.equipe.length ? "ok" : "",
    form.gammes.length ? "ok" : "",
    form.objectifs.indicateurs.length >= 4 ? "ok" : "",
  ];
  const avancement = Math.round((champsCles.filter(Boolean).length / champsCles.length) * 100);
  const etapesCochees = ETAPES_GUIDE.filter((e) => form.suivi.guide[String(e.n)]).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        surtitre="Module de formation · pharmaciens titulaires"
        titre="Écris le cahier des charges de ton Agent Trade & Gammes"
        intro="Ce module ne construit pas l'agent : il écrit, à partir de tes réponses, la série de prompts qui le construira brique par brique dans Lovable. Aucune donnée de vente réelle, aucune donnée patient, aucune donnée de santé."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {VISIOS.map((v) => (
          <Card key={v.n} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{v.n}</p>
            <h2 className="mt-2 font-display text-xl font-semibold">{v.titre}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{v.texte}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[240px] flex-1">
            <h2 className="font-display text-xl font-semibold">
              {hydrated && form.identite.nom_pharmacie
                ? `Formulaire en cours — ${form.identite.nom_pharmacie}`
                : "Commence par le formulaire"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hydrated && form.identite.nom_pharmacie
                ? `${form.poles.length} pôles · ${form.gammes.length} gammes · ${form.equipe.length} collaborateurs · ${form.plans.length} plans trade · ${etapesCochees}/24 étapes du guide cochées`
                : "Dix blocs, sauvegarde automatique dans ton navigateur, reprise possible d'un poste à l'autre."}
            </p>
            <div className="mt-3 max-w-md">
              <Progress value={avancement} label={`Avancement du formulaire : ${avancement} %`} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/formulaire">
              <Button>Commencer le formulaire</Button>
            </Link>
            <Button variant="secondary" onClick={() => loadDemo(demoForm())}>
              Charger un exemple
            </Button>
            {backupAt && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (
                    window.confirm(
                      "Revenir à la dernière sauvegarde de ta pharmacie ? La saisie actuelle sera remplacée.",
                    )
                  )
                    restoreBackup();
                }}
              >
                Revenir à ma pharmacie
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Encadre type="retenir">
        <p>
          Une brique = une demande. Un prompt fleuve donne un résultat brouillon ; huit prompts
          courts, audités entre chaque, donnent un agent qui tient debout.
        </p>
      </Encadre>

      <Encadre type="analogie">
        <p>
          C'est exactement la démarche d'une implantation de rayon : tu ne déplaces pas les douze
          gammes du pôle en une matinée. Tu fais une travée, tu recules de trois pas, tu vérifies,
          puis tu passes à la suivante.
        </p>
      </Encadre>

      <Encadre type="vigilance">
        <p>
          Vérifie tes prérequis avant la visio 2, pas au milieu de la brique 4 : un plan Lovable
          payant, des crédits suffisants pour huit briques et cinq audits, un nom de domaine OVH
          (10 à 15 € par an) et un compte Cloudflare gratuit.
        </p>
      </Encadre>
    </main>
  );
}
