import { useState } from "react";
import { Button } from "@/components/ui-kit";
import { useForm } from "@/lib/store";
import { uid, type PlanTrade } from "@/lib/types";
import { PlanTradeLabo } from "@/components/PlanTradeLabo";
import { ImportsPlanTrade } from "@/components/ImportsPlanTrade";

export const nouveauPlan = (laboratoire: string): PlanTrade => ({
  id: uid(),
  laboratoire,
  gammes: [],
  type_accord: "",
  debut: "",
  fin: "",
  interlocuteur: "",
  objectif_achat: "",
  paliers: [],
  remise_facture: "",
  rfa: "",
  ug: "",
  budget_plv: "",
  budget_formation: "",
  contreparties: [],
  date_revue: "",
  convention: "",
  commentaire: "",
  operations: [],
  documents: [],
});

export const memeLabo = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export function useLabos(): string[] {
  const { form } = useForm();
  return Array.from(
    new Set(
      [...form.gammes.map((g) => g.laboratoire), ...form.plans.map((p) => p.laboratoire)]
        .map((l) => l.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "fr"));
}

export function BlocTrade() {
  const { form, update } = useForm();
  const labos = useLabos();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [libre, setLibre] = useState("");

  function ouvrir(labo: string) {
    if (ouvert && memeLabo(ouvert, labo)) return setOuvert(null);
    if (!form.plans.some((p) => memeLabo(p.laboratoire, labo)))
      update((d) => void d.plans.push(nouveauPlan(labo)));
    setOuvert(labo);
  }

  const i = ouvert ? form.plans.findIndex((p) => memeLabo(p.laboratoire, ouvert)) : -1;
  const plan = i >= 0 ? form.plans[i] : null;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-base font-semibold">1. Plan trade global (plusieurs laboratoires)</h3>
        <ImportsPlanTrade labos={labos} />
      </section>

      <section>
        <h3 className="text-base font-semibold">2. Plan trade par laboratoire</h3>
        <p className="mb-2 text-xs text-muted-foreground">
          Cliquez sur un laboratoire (liste issue du bloc « Cartographie des gammes ») pour ouvrir
          son plan : remplissez-le à la main ou chargez son document trade.
        </p>
        <div className="flex flex-wrap gap-2">
          {labos.map((l) => {
            const p = form.plans.find((q) => memeLabo(q.laboratoire, l));
            const n = p?.operations?.length ?? 0;
            const actif = ouvert && memeLabo(ouvert, l);
            return (
              <button
                key={l}
                type="button"
                onClick={() => ouvrir(l)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  actif
                    ? "border-primary bg-primary text-primary-foreground"
                    : n
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-background hover:bg-muted"
                }`}
              >
                {l}
                {n > 0 && <span className="ml-1 text-xs opacity-80">({n} op.)</span>}
              </button>
            );
          })}
          <span className="flex gap-1">
            <input
              className="field h-8 w-44"
              placeholder="Autre laboratoire…"
              value={libre}
              onChange={(e) => setLibre(e.target.value)}
            />
            <Button
              variant="secondary"
              disabled={!libre.trim()}
              onClick={() => {
                ouvrir(libre.trim());
                setLibre("");
              }}
            >
              Ajouter
            </Button>
          </span>
        </div>
        {!labos.length && (
          <p className="mt-2 text-xs text-muted-foreground">
            Aucun laboratoire renseigné pour l'instant dans vos gammes.
          </p>
        )}

        {plan && (
          <div className="mt-3 rounded-lg border border-primary/40 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-semibold">{plan.laboratoire}</p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    update((d) => void d.plans.splice(i, 1));
                    setOuvert(null);
                  }}
                >
                  Supprimer ce plan
                </Button>
                <Button variant="secondary" onClick={() => setOuvert(null)}>
                  Fermer
                </Button>
              </div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(["debut", "fin"] as const).map((c) => (
                <label key={c} className="text-xs text-muted-foreground">
                  {c === "debut" ? "Début" : "Fin"}
                  <input
                    className="field mt-1"
                    placeholder="JJ/MM/AAAA"
                    value={plan[c]}
                    onChange={(e) => update((d) => void (d.plans[i][c] = e.target.value))}
                  />
                </label>
              ))}
            </div>
            <PlanTradeLabo plan={plan} set={(fn) => update((d) => fn(d.plans[i]))} />
          </div>
        )}
      </section>
    </div>
  );
}
