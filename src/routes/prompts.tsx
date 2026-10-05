import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Encadre, PageHeader } from "@/components/ui-kit";
import { useForm } from "@/lib/store";
import { generatePrompts, variablesNonResolues, type GeneratedPrompt } from "@/lib/promptEngine";
import { downloadDoc, downloadMarkdown } from "@/lib/documents";

export const Route = createFileRoute("/prompts")({
  head: () => ({
    meta: [
      { title: "Prompts générés | Agent Trade & Gammes" },
      {
        name: "description",
        content:
          "La bibliothèque complète des prompts personnalisés : prompt maître, briques 2 à 8, audits, extensions et sécurisation. À copier tels quels dans Lovable.",
      },
      { property: "og:title", content: "Prompts générés — Agent Trade & Gammes" },
      {
        property: "og:description",
        content: "Copier, télécharger en .md ou .doc, cocher « prompt collé et validé ».",
      },
    ],
  }),
  component: Prompts,
});

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function PromptCard({
  p,
  index,
  verrouille,
}: {
  p: GeneratedPrompt;
  index: number;
  verrouille: boolean;
}) {
  const { form, update } = useForm();
  const [ouvert, setOuvert] = useState(index === 0);
  const [copie, setCopie] = useState(false);
  const force = !!form.suivi.promptsForces[p.id];
  const valide = !!form.suivi.promptsValides[p.id];
  const bloque = verrouille && !force;

  const couleur =
    p.kind === "regles"
      ? "var(--color-success)"
      : p.kind === "audit"
        ? "var(--color-warning)"
      : p.kind === "extension"
        ? "var(--color-info)"
        : p.kind === "securisation"
          ? "var(--color-accent)"
          : "var(--color-primary)";

  return (
    <Card className={bloque ? "opacity-60" : ""}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
        <span
          className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold"
          style={{ backgroundColor: `${couleur}1a`, color: couleur }}
        >
          {p.numero}
        </span>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOuvert((o) => !o)}>
          <span className="block font-display text-lg font-semibold">{p.title}</span>
          <span className="text-xs text-muted-foreground">
            {p.words} mots
            {valide ? " · validé" : ""}
          </span>
        </button>
        {valide ? <Badge color="var(--color-success)">Collé et validé</Badge> : null}
        <button type="button" onClick={() => setOuvert((o) => !o)} className="text-muted-foreground">
          {ouvert ? "▲" : "▼"}
        </button>
      </div>

      {bloque ? (
        <div className="border-t border-border px-4 py-3 text-sm sm:px-5">
          <p className="text-muted-foreground">
            À utiliser après validation de l'étape précédente. {p.unlockLabel}
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              if (
                window.confirm(
                  "Débloquer quand même ? Coller un prompt avant d'avoir audité la brique précédente propage les erreurs sur toutes les briques suivantes.",
                )
              )
                update((d) => void (d.suivi.promptsForces[p.id] = true));
            }}
          >
            Débloquer quand même
          </Button>
        </div>
      ) : ouvert ? (
        <div className="border-t border-border px-4 py-4 sm:px-5">
          <p className="mb-3 text-xs font-medium text-warning" style={{ color: "var(--color-warning)" }}>
            {p.kind === "regles"
              ? "Ce n'est pas un prompt à envoyer dans le chat. Dans Lovable, ouvre Settings → Knowledge et colle ces règles : elles s'appliqueront à toutes tes demandes. À faire juste après la création du projet, avant le Prompt maître."
              : "Copie ce prompt tel quel. Ne lui ajoute rien : c'est la première cause d'écart entre participants."}
          </p>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-relaxed">
            {p.text}
          </pre>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(p.text);
                setCopie(true);
                window.setTimeout(() => setCopie(false), 2000);
              }}
            >
              {copie ? "Copié !" : "Copier"}
            </Button>
            <Button variant="secondary" onClick={() => downloadMarkdown(slug(`${p.numero}-${p.title}`), p.text)}>
              Télécharger .md
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadDoc(slug(`${p.numero}-${p.title}`), p.title, p.text)}
            >
              Télécharger .doc
            </Button>
            <label className="ml-auto flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-primary)]"
                checked={valide}
                onChange={(e) => update((d) => void (d.suivi.promptsValides[p.id] = e.target.checked))}
              />
              Prompt collé et validé
            </label>
          </div>
          <textarea
            className="field mt-3"
            rows={2}
            placeholder="Notes personnelles sur ce prompt (ce que l'agent a mal compris, ce que tu as corrigé…)"
            value={form.suivi.notes[p.id] ?? ""}
            onChange={(e) => update((d) => void (d.suivi.notes[p.id] = e.target.value))}
          />
        </div>
      ) : null}
    </Card>
  );
}

function Prompts() {
  const { form } = useForm();
  const [controle, setControle] = useState(false);

  const pret =
    form.identite.nom_pharmacie.trim() !== "" &&
    form.identite.nom_titulaire.trim() !== "" &&
    form.gammes.length > 0;

  const prompts = useMemo(() => (pret ? generatePrompts(form) : []), [form, pret]);
  const anomalies = useMemo(() => variablesNonResolues(prompts), [prompts]);

  if (!pret) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <PageHeader surtitre="Onglet Prompts" titre="Tes prompts personnalisés" />
        <Card className="p-8 text-center">
          <p className="text-lg font-medium">Remplis d'abord le formulaire pour générer tes prompts.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Il faut au minimum le nom de la pharmacie, le nom du titulaire et une gamme.
          </p>
          <div className="mt-5">
            <Link to="/formulaire">
              <Button>Aller au formulaire</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const construction = prompts.filter(
    (p) => p.kind === "regles" || p.kind === "brique" || p.kind === "audit",
  );
  const extensions = prompts.filter((p) => p.kind === "extension");
  const securisation = prompts.filter((p) => p.kind === "securisation");

  const estVerrouille = (p: GeneratedPrompt) =>
    !!p.unlockedBy && !form.suivi.promptsValides[p.unlockedBy];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        surtitre="Onglet Prompts"
        titre={`Prompts — ${form.identite.nom_pharmacie}`}
        intro="Colle-les dans l'ordre, un par un, en auditant entre chaque brique. Chaque carte se déverrouille quand la précédente est cochée « collé et validé »."
      />

      <Encadre type="retenir">
        <p>
          Une brique = une demande. Après chaque audit validé : Publish, puis renomme la version dans
          History (« Fin Prompt 3 — Audit OK ») et exporte ton JSON de sauvegarde.
        </p>
      </Encadre>

      <section className="mt-6 space-y-3">
        <h2 className="font-display text-xl font-semibold">Construction (visio 2)</h2>
        {construction.map((p, i) => (
          <PromptCard key={p.id} p={p} index={i} verrouille={estVerrouille(p)} />
        ))}
      </section>

      {extensions.length ? (
        <section className="mt-10 space-y-3">
          <h2 className="font-display text-xl font-semibold">Extensions à la carte</h2>
          {extensions.map((p, i) => (
            <PromptCard key={p.id} p={p} index={i + 1} verrouille={estVerrouille(p)} />
          ))}
        </section>
      ) : null}

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl font-semibold">Sécurisation (visio 3)</h2>
        {securisation.map((p, i) => (
          <PromptCard key={p.id} p={p} index={i + 1} verrouille={estVerrouille(p)} />
        ))}
      </section>

      <section className="mt-10">
        <Button variant="ghost" onClick={() => setControle((v) => !v)}>
          {controle ? "Masquer" : "Afficher"} l'écran de contrôle (éditeur)
        </Button>
        {controle ? (
          <Card className="mt-3 p-4 text-sm">
            <p>
              {prompts.length} prompts générés ·{" "}
              {anomalies.length
                ? `${anomalies.length} anomalie(s) d'interpolation`
                : "aucune variable non résolue, aucun « undefined »"}
            </p>
            {anomalies.length ? (
              <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                {anomalies.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        ) : null}
      </section>
    </main>
  );
}
