import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui-kit";
import { lireFichier } from "@/lib/importPlanTrade";
import type { AchatGamme, ImportPlan } from "@/lib/types";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "@/lib/store";
import { extraireDocument } from "@/lib/extraction.functions";
import { plansDepuisExtraction, remplirAchat, texteDocuments } from "@/lib/remplissage";

const FORMATS = ".pdf,.docx,.doc,.csv,.tsv,.txt,.md,.xlsx,.xls,.xlsm";

export function ImportsAccordGamme({
  achat,
  set,
  nomGamme,
}: {
  achat: AchatGamme;
  set: (fn: (a: AchatGamme) => void) => void;
  nomGamme: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [chargement, setChargement] = useState(false);
  const docs: ImportPlan[] = achat.documents ?? [];
  const { update } = useForm();
  const extraire = useServerFn(extraireDocument);
  const [analyse, setAnalyse] = useState(false);

  async function remplir() {
    setAnalyse(true);
    try {
      const x = await extraire({
        data: { texte: texteDocuments(docs), marque: nomGamme, mode: "achat" },
      });
      let n = 0;
      set((a) => void (n = remplirAchat(a, x.achat)));
      const plans = plansDepuisExtraction(x, nomGamme);
      if (plans.length) update((d) => void d.plans.push(...plans));
      toast.success(
        `${n} champ(s) Achat pré-rempli(s)${plans.length ? ` et ${plans.length} plan(s) trade ajouté(s) au bloc 6` : ""}. Vos saisies existantes n'ont pas été modifiées.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "La lecture automatique a échoué.");
    } finally {
      setAnalyse(false);
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setChargement(true);
    const lus: ImportPlan[] = [];
    for (const file of Array.from(files)) {
      try {
        lus.push(await lireFichier(file));
      } catch {
        toast.error(`Impossible de lire ${file.name}`);
      }
    }
    if (lus.length) {
      set((a) => void ((a.documents ??= []).push(...lus)));
      toast.success(
        lus.length === 1
          ? `Accord commercial rattaché à ${nomGamme || "la gamme"}.`
          : `${lus.length} documents rattachés à ${nomGamme || "la gamme"}.`,
      );
    }
    setChargement(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="mb-3 rounded-md border border-dashed border-border bg-background/60 p-3">
      <p className="text-sm font-medium">Accord commercial du laboratoire</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Déposez ici le document de conditions commerciales / plan trade de la marque (PDF, Word,
        Excel). Le texte est transmis à l'agent : il en déduit remises, franco, RFA, périmés,
        contacts et calendrier trade, que vous pourrez corriger.
      </p>

      <div className="mt-2">
        <input
          ref={input}
          type="file"
          multiple
          accept={FORMATS}
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <Button variant="secondary" onClick={() => input.current?.click()} disabled={chargement}>
          {chargement ? "Lecture en cours…" : "Charger un document"}
        </Button>
        {docs.length > 0 && (
          <Button onClick={() => void remplir()} disabled={analyse} className="ml-2">
            {analyse ? "Analyse du document… (jusqu'à 1 min)" : "Remplir depuis le document"}
          </Button>
        )}
      </div>

      {docs.length > 0 && (
        <div className="mt-2 space-y-2">
          {docs.map((doc, i) => (
            <div key={doc.id} className="rounded-md border border-border bg-background p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  {doc.nom_fichier}{" "}
                  <span className="text-xs text-muted-foreground">
                    {doc.format} ·{" "}
                    {doc.lignes.length
                      ? `${doc.lignes.length} lignes lues`
                      : `${doc.texte.length} caractères lus`}
                  </span>
                </p>
                <Button
                  variant="ghost"
                  onClick={() => set((a) => void (a.documents ?? []).splice(i, 1))}
                >
                  Supprimer
                </Button>
              </div>
              <input
                className="field mt-2"
                placeholder="Commentaire (contexte pour l'agent)"
                value={doc.commentaire}
                onChange={(e) =>
                  set((a) => void ((a.documents ?? [])[i].commentaire = e.target.value))
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
