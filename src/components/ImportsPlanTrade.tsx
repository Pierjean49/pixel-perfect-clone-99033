import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui-kit";
import { useForm } from "@/lib/store";
import { lireFichier, plansDepuisLignes, PORTEES_IMPORT } from "@/lib/importPlanTrade";
import type { ImportPlan } from "@/lib/types";
import { useServerFn } from "@tanstack/react-start";
import { extraireDocument } from "@/lib/extraction.functions";
import { plansDepuisExtraction, texteDocuments } from "@/lib/remplissage";

const FORMATS = ".csv,.tsv,.txt,.md,.xlsx,.xls,.xlsm,.pdf,.docx,.doc";

export function ImportsPlanTrade() {
  const { form, update } = useForm();
  const input = useRef<HTMLInputElement>(null);
  const [chargement, setChargement] = useState(false);
  const docs: ImportPlan[] = form.imports_plans ?? [];

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
      update((d) => void ((d.imports_plans ??= []).push(...lus)));
      toast.success(
        lus.length === 1 ? "Fichier importé." : `${lus.length} fichiers importés.`,
      );
    }
    setChargement(false);
    if (input.current) input.current.value = "";
  }

  const extraire = useServerFn(extraireDocument);
  const [analyse, setAnalyse] = useState<string | null>(null);

  async function remplirIA(doc: ImportPlan) {
    setAnalyse(doc.id);
    try {
      const x = await extraire({ data: { texte: texteDocuments([doc]), marque: "", mode: "trade" } });
      const plans = plansDepuisExtraction(x);
      if (!plans.length) toast.error("Aucun plan trade trouvé dans ce document.");
      else {
        update((d) => void d.plans.push(...plans));
        toast.success(`${plans.length} plan(s) trade pré-rempli(s) depuis ${doc.nom_fichier}. À vérifier.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "La lecture automatique a échoué.");
    } finally {
      setAnalyse(null);
    }
  }

  function creerPlans(doc: ImportPlan) {
    const nouveaux = plansDepuisLignes(doc.lignes);
    if (!nouveaux.length) {
      toast.error("Aucun tableau exploitable détecté dans ce fichier.");
      return;
    }
    update((d) => void d.plans.push(...nouveaux));
    toast.success(
      `${nouveaux.length} plan(s) trade créé(s) depuis ${doc.nom_fichier}. À vérifier et compléter.`,
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <p className="text-sm font-medium">Importer un plan trade</p>
      <p className="mt-1 text-xs text-muted-foreground">
        CSV, Excel, PDF ou Word : plan annuel d'un laboratoire, plan annuel de tous les
        laboratoires, ou plan mensuel. Les tableaux (CSV / Excel) peuvent pré-remplir les plans
        ci-dessous ; les PDF et Word sont conservés comme document de référence transmis à l'agent.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <input
          ref={input}
          type="file"
          multiple
          accept={FORMATS}
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <Button variant="secondary" onClick={() => input.current?.click()} disabled={chargement}>
          {chargement ? "Lecture en cours…" : "Choisir un ou plusieurs fichiers"}
        </Button>
      </div>

      {docs.length > 0 && (
        <div className="mt-3 space-y-2">
          {docs.map((doc, i) => {
            const detectes = doc.lignes.length ? plansDepuisLignes(doc.lignes).length : 0;
            return (
              <div key={doc.id} className="rounded-md border border-border bg-background p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {doc.nom_fichier}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {doc.format} ·{" "}
                      {doc.lignes.length
                        ? `${doc.lignes.length} lignes lues`
                        : `${doc.texte.length} caractères lus`}
                    </span>
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => update((d) => void d.imports_plans.splice(i, 1))}
                  >
                    Supprimer
                  </Button>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-muted-foreground">
                    Portée du document
                    <select
                      className="field mt-1"
                      value={doc.portee}
                      onChange={(e) =>
                        update((d) => void (d.imports_plans[i].portee = e.target.value))
                      }
                    >
                      <option value="">À préciser</option>
                      {PORTEES_IMPORT.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Commentaire (contexte pour l'agent)
                    <input
                      className="field mt-1"
                      value={doc.commentaire}
                      onChange={(e) =>
                        update((d) => void (d.imports_plans[i].commentaire = e.target.value))
                      }
                    />
                  </label>
                </div>

                {doc.lignes.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      {detectes > 0
                        ? `${detectes} laboratoire(s) détecté(s) dans le tableau.`
                        : "Aucune colonne « laboratoire » reconnue : le document reste utilisable comme référence."}
                    </p>
                    {detectes > 0 && (
                      <Button className="mt-2" variant="secondary" onClick={() => creerPlans(doc)}>
                        Pré-remplir les plans trade
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Texte extrait et transmis à l'agent comme document de référence.
                  </p>
                )}
                <Button
                  className="mt-2"
                  onClick={() => void remplirIA(doc)}
                  disabled={analyse === doc.id}
                >
                  {analyse === doc.id
                    ? "Analyse du document… (jusqu'à 1 min)"
                    : "Remplir les plans trade depuis le document"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
