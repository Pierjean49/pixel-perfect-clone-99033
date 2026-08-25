import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageHeader } from "@/components/ui-kit";
import { GLOSSAIRE_IA, GLOSSAIRE_TRADE } from "@/data/reference";

export const Route = createFileRoute("/glossaire")({
  head: () => ({
    meta: [
      { title: "Glossaire trade et IA | Agent Trade & Gammes" },
      {
        name: "description",
        content:
          "Le vocabulaire du trade, du merchandising et de l'IA expliqué simplement : sell-in, RFA, palier, facing, prompt, RLS, MFA, DNS.",
      },
      { property: "og:title", content: "Glossaire — Agent Trade & Gammes" },
      {
        property: "og:description",
        content: "Deux colonnes, recherche instantanée : trade & officine, IA & technique.",
      },
    ],
  }),
  component: Glossaire,
});

function normalise(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function Colonne({
  titre,
  entrees,
}: {
  titre: string;
  entrees: { terme: string; definition: string }[];
}) {
  return (
    <div>
      <h2 className="mb-3 font-display text-xl font-semibold">{titre}</h2>
      <div className="space-y-2">
        {entrees.length ? (
          entrees.map((e) => (
            <Card key={e.terme} className="p-4">
              <p className="font-medium">{e.terme}</p>
              <p className="mt-1 text-sm text-muted-foreground">{e.definition}</p>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Aucun terme ne correspond.</p>
        )}
      </div>
    </div>
  );
}

function Glossaire() {
  const [q, setQ] = useState("");
  const filtre = (arr: { terme: string; definition: string }[]) =>
    arr.filter((e) => normalise(`${e.terme} ${e.definition}`).includes(normalise(q)));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader
        surtitre="Onglet Glossaire"
        titre="Le vocabulaire, sans jargon"
        intro="Tout ce qu'il faut comprendre pour suivre les trois visios : les termes du commerce en officine d'un côté, ceux de l'IA et de la technique de l'autre."
      />
      <input
        className="field mb-8 max-w-md"
        placeholder="Rechercher un terme…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <Colonne titre="Trade et officine" entrees={filtre(GLOSSAIRE_TRADE)} />
        <Colonne titre="IA et technique" entrees={filtre(GLOSSAIRE_IA)} />
      </div>
    </main>
  );
}
