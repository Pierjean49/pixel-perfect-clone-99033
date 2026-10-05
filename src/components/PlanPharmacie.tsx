import { useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui-kit";
import { useForm } from "@/lib/store";
import { uid } from "@/lib/types";
import { lirePlan } from "@/lib/plan.functions";

const TYPES = ["TG", "Descente", "Gondole", "Vitrine", "Comptoir", "Présentoir", "Autre"];
const ZONES = ["chaude", "tiède", "froide"];
const COULEUR: Record<string, string> = {
  chaude: "border-l-4 border-l-destructive",
  tiède: "border-l-4 border-l-accent",
  froide: "border-l-4 border-l-primary",
};

function lireDataUrl(f: File): Promise<string> {
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = ko;
    r.readAsDataURL(f);
  });
}

/** Réduit l'image pour tenir dans la sauvegarde du navigateur. */
async function reduire(f: File): Promise<string> {
  const src = await lireDataUrl(f);
  const img = new Image();
  await new Promise((ok, ko) => ((img.onload = ok), (img.onerror = ko), (img.src = src)));
  const k = Math.min(1, 1800 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}

export function PlanPharmacie() {
  const { form, update } = useForm();
  const input = useRef<HTMLInputElement>(null);
  const [analyse, setAnalyse] = useState(false);
  const [synthese, setSynthese] = useState("");
  const lire = useServerFn(lirePlan);
  const plan = form.merch.plan ?? null;
  const emp = form.merch.emplacements ?? [];

  async function onFile(f?: File) {
    if (!f) return;
    try {
      if (f.type === "application/pdf") {
        if (f.size > 3_000_000) return void toast.error("PDF trop lourd (3 Mo max). Exportez-le en image.");
        const data = await lireDataUrl(f);
        update((d) => void (d.merch.plan = { nom: f.name, type: f.type, data }));
      } else if (f.type.startsWith("image/")) {
        const data = await reduire(f);
        update((d) => void (d.merch.plan = { nom: f.name, type: "image/jpeg", data }));
      } else toast.error("Format non pris en charge : image (JPG, PNG) ou PDF.");
    } catch {
      toast.error(`Impossible de lire ${f.name}`);
    }
    if (input.current) input.current.value = "";
  }

  async function analyser() {
    if (!plan) return;
    setAnalyse(true);
    try {
      const x = await lire({
        data: { type: plan.type, data: plan.data, gammes: form.gammes.map((g) => g.nom).filter(Boolean) },
      });
      let n = 0;
      update((d) => {
        const l = (d.merch.emplacements ??= []);
        for (const e of x.emplacements) {
          if (l.some((q) => q.type === e.type && q.numero === e.numero && q.numero)) continue;
          l.push({ id: uid(), ...e });
          n++;
        }
      });
      setSynthese(x.analyse);
      toast.success(`${n} emplacement(s) lu(s) sur le plan. À vérifier.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "La lecture du plan a échoué.");
    } finally {
      setAnalyse(false);
    }
  }

  const set = (j: number, c: "type" | "numero" | "gammes" | "zone", v: string) =>
    update((d) => void ((d.merch.emplacements ?? [])[j][c] = v));

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <p className="text-sm font-medium">Plan de la pharmacie</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Chargez le plan (photo, image ou PDF) avec les TG numérotées et le nom des gammes sur les
        descentes. Cliquez sur « Lire le plan » : les emplacements sont listés et classés en zones
        chaudes, tièdes ou froides. Tout reste modifiable.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button variant="secondary" onClick={() => input.current?.click()}>
          {plan ? "Remplacer le plan" : "Charger le plan"}
        </Button>
        {plan && (
          <>
            <Button onClick={() => void analyser()} disabled={analyse}>
              {analyse ? "Lecture du plan… (jusqu'à 1 min)" : "Lire le plan"}
            </Button>
            <Button variant="ghost" onClick={() => update((d) => void (d.merch.plan = null))}>
              Supprimer le plan
            </Button>
          </>
        )}
      </div>

      {plan &&
        (plan.type.startsWith("image/") ? (
          <img src={plan.data} alt="Plan de la pharmacie" className="mt-3 max-h-[480px] rounded-md border border-border" />
        ) : (
          <p className="mt-2 text-sm">{plan.nom} (PDF)</p>
        ))}

      {synthese && (
        <div className="mt-3 rounded-md border border-border bg-background p-3 text-sm">
          <p className="mb-1 font-medium">Analyse du plan</p>
          <p className="whitespace-pre-line text-muted-foreground">{synthese}</p>
        </div>
      )}

      <div className="mt-3">
        <p className="mb-1 text-sm font-medium">Emplacements</p>
        {emp.length > 0 && (
          <div className="mb-1 hidden grid-cols-[8rem_5rem_1fr_7rem_2rem] gap-2 text-xs text-muted-foreground md:grid">
            <span>Type</span>
            <span>N°</span>
            <span>Gammes présentes</span>
            <span>Zone</span>
            <span />
          </div>
        )}
        {emp.map((e, j) => (
          <div key={e.id} className={`mb-2 grid gap-2 rounded-md pl-1 md:grid-cols-[8rem_5rem_1fr_7rem_2rem] ${COULEUR[e.zone] ?? ""}`}>
            <select className="field" value={e.type} onChange={(ev) => set(j, "type", ev.target.value)}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <input className="field" placeholder="N°" value={e.numero} onChange={(ev) => set(j, "numero", ev.target.value)} />
            <input className="field" placeholder="Gammes" value={e.gammes} onChange={(ev) => set(j, "gammes", ev.target.value)} />
            <select className="field" value={e.zone} onChange={(ev) => set(j, "zone", ev.target.value)}>
              <option value="">Zone ?</option>
              {ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
            <Button variant="ghost" onClick={() => update((d) => void (d.merch.emplacements ?? []).splice(j, 1))}>
              ✕
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          onClick={() =>
            update((d) => void (d.merch.emplacements ??= []).push({ id: uid(), type: "TG", numero: "", gammes: "", zone: "" }))
          }
        >
          Ajouter un emplacement
        </Button>
      </div>
    </div>
  );
}
