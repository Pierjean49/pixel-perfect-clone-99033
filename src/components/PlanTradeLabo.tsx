import { useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui-kit";
import { lireFichier } from "@/lib/importPlanTrade";
import { extraireDocument } from "@/lib/extraction.functions";
import { completerPlan, texteDocuments } from "@/lib/remplissage";
import { uid, type PlanTrade } from "@/lib/types";

const FORMATS = ".pdf,.docx,.doc,.csv,.tsv,.txt,.md,.xlsx,.xls,.xlsm";

/** Document trade propre à un laboratoire + calendrier des opérations. */
export function PlanTradeLabo({
  plan,
  set,
}: {
  plan: PlanTrade;
  set: (fn: (p: PlanTrade) => void) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [lecture, setLecture] = useState(false);
  const [analyse, setAnalyse] = useState(false);
  const extraire = useServerFn(extraireDocument);
  const docs = plan.documents ?? [];
  const ops = plan.operations ?? [];

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setLecture(true);
    for (const f of Array.from(files)) {
      try {
        const doc = await lireFichier(f);
        set((p) => void (p.documents ??= []).push(doc));
      } catch {
        toast.error(`Impossible de lire ${f.name}`);
      }
    }
    setLecture(false);
    if (input.current) input.current.value = "";
  }

  async function remplir() {
    setAnalyse(true);
    try {
      const x = await extraire({
        data: { texte: texteDocuments(docs), marque: plan.laboratoire, mode: "achat" },
      });
      const source = x.plans[0];
      if (!source) {
        toast.error("Aucune information trade trouvée dans le document.");
        return;
      }
      // Fusionne les éventuels plans multiples du document en un seul pour ce laboratoire.
      for (const autre of x.plans.slice(1)) source.operations.push(...autre.operations);
      let n = 0;
      set((p) => void (n = completerPlan(p, source)));
      toast.success(`${n} information(s) ajoutée(s) au plan ${plan.laboratoire || ""}. Vos saisies n'ont pas été modifiées.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "La lecture automatique a échoué.");
    } finally {
      setAnalyse(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-md border border-dashed border-border bg-background/60 p-3">
        <p className="text-sm font-medium">Document trade de ce laboratoire</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Chargez le plan trade du labo (PDF, Word, Excel) puis cliquez sur « Remplir depuis le
          document » : les champs vides et le calendrier des opérations se remplissent. Ou
          saisissez tout à la main ci-dessous.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            multiple
            accept={FORMATS}
            className="hidden"
            onChange={(e) => void onFiles(e.target.files)}
          />
          <Button variant="secondary" onClick={() => input.current?.click()} disabled={lecture}>
            {lecture ? "Lecture en cours…" : "Charger un document"}
          </Button>
          {docs.length > 0 && (
            <Button onClick={() => void remplir()} disabled={analyse}>
              {analyse ? "Analyse du document… (jusqu'à 1 min)" : "Remplir depuis le document"}
            </Button>
          )}
        </div>
        {docs.map((d, k) => (
          <div key={d.id} className="mt-2 flex items-center justify-between gap-2 text-sm">
            <span>
              {d.nom_fichier}{" "}
              <span className="text-xs text-muted-foreground">
                {d.format} · {d.texte.length || d.lignes.length} {d.texte.length ? "caractères" : "lignes"} lus
              </span>
            </span>
            <Button variant="ghost" onClick={() => set((p) => void (p.documents ?? []).splice(k, 1))}>
              Supprimer
            </Button>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">Calendrier des opérations</p>
        {ops.length > 0 && (
          <div className="mb-1 hidden grid-cols-[7rem_1fr_1fr_1.5fr_1fr_2rem] gap-2 text-xs text-muted-foreground md:grid">
            <span>Mois</span>
            <span>Produits</span>
            <span>Opération</span>
            <span>Fonctionnement</span>
            <span>Contrepartie</span>
            <span />
          </div>
        )}
        {ops.map((o, j) => (
          <div key={o.id} className="mb-2 grid gap-2 md:grid-cols-[7rem_1fr_1fr_1.5fr_1fr_2rem]">
            {(["mois", "produits", "operation", "fonctionnement", "contrepartie"] as const).map((c) => (
              <input
                key={c}
                className="field"
                placeholder={
                  { mois: "Mois", produits: "Produits", operation: "Opération", fonctionnement: "Fonctionnement", contrepartie: "Contrepartie" }[c]
                }
                value={o[c] ?? ""}
                onChange={(e) => set((p) => void ((p.operations ?? [])[j][c] = e.target.value))}
              />
            ))}
            <Button variant="ghost" onClick={() => set((p) => void (p.operations ?? []).splice(j, 1))}>
              ✕
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          onClick={() =>
            set((p) =>
              void (p.operations ??= []).push({
                id: uid(),
                mois: "",
                produits: "",
                operation: "",
                fonctionnement: "",
                contrepartie: "",
              }),
            )
          }
        >
          Ajouter une opération
        </Button>
      </div>
    </div>
  );
}
