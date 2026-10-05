import { useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AvisIA, Button } from "@/components/ui-kit";
import { useForm } from "@/lib/store";
import { lireFichier } from "@/lib/importPlanTrade";
import type { ImportPlan } from "@/lib/types";
import { extraireDocument } from "@/lib/extraction.functions";
import { completerPlan, texteDocuments } from "@/lib/remplissage";
import { memeLabo, nouveauPlan } from "@/components/BlocTrade";

const FORMATS = ".csv,.tsv,.txt,.md,.xlsx,.xls,.xlsm,.pdf,.docx,.doc";

const correspond = (extrait: string, labo: string) => {
  const a = extrait.trim().toLowerCase();
  const b = labo.trim().toLowerCase();
  return !!a && (a === b || a.includes(b) || b.includes(a));
};

/** Document regroupant plusieurs laboratoires : ne remplit que les laboratoires cochés. */
export function ImportsPlanTrade({ labos }: { labos: string[] }) {
  const { form, update } = useForm();
  const input = useRef<HTMLInputElement>(null);
  const [lecture, setLecture] = useState(false);
  const [analyse, setAnalyse] = useState(false);
  const [choix, setChoix] = useState<string[]>([]);
  const extraire = useServerFn(extraireDocument);
  const docs: ImportPlan[] = form.imports_plans ?? [];

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setLecture(true);
    const lus: ImportPlan[] = [];
    for (const f of Array.from(files)) {
      try {
        lus.push(await lireFichier(f));
      } catch {
        toast.error(`Impossible de lire ${f.name}`);
      }
    }
    if (lus.length) update((d) => void (d.imports_plans ??= []).push(...lus));
    setLecture(false);
    if (input.current) input.current.value = "";
  }

  async function remplir() {
    setAnalyse(true);
    try {
      const x = await extraire({
        data: {
          texte: texteDocuments(docs),
          marque: `Laboratoires à extraire uniquement : ${choix.join(", ")}`,
          mode: "trade",
        },
      });
      const remplis: string[] = [];
      let total = 0;
      update((d) => {
        for (const labo of choix) {
          const sources = x.plans.filter((p) => correspond(p.laboratoire, labo));
          if (!sources.length) continue;
          let plan = d.plans.find((p) => memeLabo(p.laboratoire, labo));
          if (!plan) {
            plan = nouveauPlan(labo);
            d.plans.push(plan);
          }
          for (const s of sources) total += completerPlan(plan, { ...s, laboratoire: labo });
          remplis.push(labo);
        }
      });
      const absents = choix.filter((l) => !remplis.includes(l));
      if (remplis.length)
        toast.success(`Rempli : ${remplis.join(", ")} (${total} information(s)).`);
      if (absents.length) toast.error(`Non trouvé dans le document : ${absents.join(", ")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "La lecture automatique a échoué.");
    } finally {
      setAnalyse(false);
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        Charge ton plan trade mensuel ou annuel regroupant plusieurs laboratoires, coche ceux à
        remplir, puis clique sur « Remplir ». Les autres laboratoires du document sont ignorés.
      </p>
      <AvisIA />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          multiple
          accept={FORMATS}
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <Button variant="secondary" onClick={() => input.current?.click()} disabled={lecture}>
          {lecture ? "Lecture en cours…" : "Charger le document global"}
        </Button>
      </div>

      {docs.map((doc, k) => (
        <div key={doc.id} className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span>
            {doc.nom_fichier}{" "}
            <span className="text-xs text-muted-foreground">{doc.format}</span>
          </span>
          <Button variant="ghost" onClick={() => update((d) => void d.imports_plans.splice(k, 1))}>
            Supprimer
          </Button>
        </div>
      ))}

      {docs.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-sm font-medium">Gammes à remplir</p>
          {labos.length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {labos.map((l) => (
                <label key={l} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={choix.includes(l)}
                    onChange={() =>
                      setChoix((c) => (c.includes(l) ? c.filter((x) => x !== l) : [...c, l]))
                    }
                  />
                  {l}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sélectionnez d'abord des gammes dans la cartographie des gammes.
            </p>
          )}
          <Button
            className="mt-3"
            onClick={() => void remplir()}
            disabled={analyse || !choix.length}
          >
            {analyse ? "Analyse du document… (jusqu'à 1 min)" : `Remplir (${choix.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}
