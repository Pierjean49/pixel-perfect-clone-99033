import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Section, Grid } from "@/components/Section";
import { Area, CheckGroup, Checkbox, Label, Radio, Select, Text } from "@/components/fields";
import { Badge, Button, Card, Encadre, PageHeader, Progress } from "@/components/ui-kit";
import { useForm } from "@/lib/store";
import { demoForm } from "@/data/demo";
import { apercuPromptMaitre } from "@/lib/promptEngine";
import { download } from "@/lib/documents";
import { emptyAchat, emptyForm, uid, type AchatGamme, type FormState, type Gamme } from "@/lib/types";
import {
  AXES_DIFFERENCIATION,
  CONTREPARTIES,
  COULEURS_RESERVE,
  CRITERES_QUALITATIFS,
  EMPLACEMENTS,
  EXTENSIONS,
  GROUPEMENTS,
  INDICATEURS,
  LGOS,
  MARQUES_PAR_SECTEUR,
  PLV_DISPONIBLES,
  POLES,
  POSITIONNEMENTS_GAMME,
  RECOMPENSES_CHALLENGE,
  RESPONSABILITES_TRADE,
  ROLES_EQUIPE,
  SERVICES_PROPOSES,
  TYPOLOGIES_CLIENTELE,
  SOUS_POLES_SUGGERES,
  STATUTS_GAMME,
  TYPES_ACCORD,
  TYPES_ANIMATION,
} from "@/data/reference";

export const Route = createFileRoute("/formulaire")({
  head: () => ({
    meta: [
      { title: "Formulaire de l'officine | Agent Trade & Gammes" },
      {
        name: "description",
        content:
          "Dix blocs de saisie : identité, pôles, positionnement, équipe, gammes, plans trade, objectifs, primes, merchandising et options. Sauvegarde automatique dans le navigateur.",
      },
      { property: "og:title", content: "Formulaire de l'officine — Agent Trade & Gammes" },
      {
        property: "og:description",
        content: "Décris ton officine, le module en tire tes prompts personnalisés.",
      },
    ],
  }),
  component: Formulaire,
});

const rempli = (...vals: unknown[]) =>
  vals.filter((v) => (Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "")).length;

const couleurPole = (nom: string) =>
  POLES.find((p) => p.nom === nom)?.couleur ??
  COULEURS_RESERVE[Math.abs(nom.length * 7) % COULEURS_RESERVE.length];

function Formulaire() {
  const {
    form,
    update,
    replace,
    reset,
    savedAt,
    backupAt,
    recoveryCount,
    loadDemo,
    saveBackup,
    restoreBackup,
    restoreLatestRecovery,
  } = useForm();
  const navigate = useNavigate();
  const [apercuOuvert, setApercuOuvert] = useState(true);
  const [tousSecteurs, setTousSecteurs] = useState(false);
  const [equipeFermee, setEquipeFermee] = useState<Record<string, boolean>>({});

  const nomsCollaborateurs = form.equipe
    .map((c) => `${c.prenom} ${c.nom}`.trim())
    .filter((n) => n.length > 1);
  const nomsGammes = form.gammes.map((g) => g.nom).filter(Boolean);
  const responsableAuto = (pole: string) => {
    const c =
      form.equipe.find((e) => e.pole === pole && e.responsabilite === "Responsable de pôle") ??
      form.equipe.find((e) => e.pole === pole);
    return c ? `${c.prenom} ${c.nom}`.trim() : "";
  };
  const nomsPoles = form.poles.map((p) => p.nom);
  const sousPolesDuPole = (pole: string) =>
    (form.poles.find((p) => p.nom === pole)?.sous_poles ?? []).filter(Boolean);
  const tousSousPoles = Array.from(
    new Set(form.poles.flatMap((p) => (p.sous_poles ?? []).filter(Boolean))),
  );

  const apercu = useMemo(() => apercuPromptMaitre(form), [form]);

  const obligatoiresOk =
    form.identite.nom_pharmacie.trim() !== "" &&
    form.identite.nom_titulaire.trim() !== "" &&
    form.gammes.length > 0;

  const liensManquants = [
    ...form.poles.filter((p) => !p.responsable.trim()).map((p) => `Responsable du pôle ${p.nom}`),
    ...form.gammes.filter((g) => !g.referent.trim()).map((g) => `Référent de la gamme ${g.nom}`),
    ...form.equipe
      .filter((c) => !c.pole.trim())
      .map((c) => `Pôle principal de ${c.prenom} ${c.nom}`),
  ];

  const exporter = () => {
    const copie: FormState = structuredClone(form);
    download(
      `formulaire-trade-${(form.identite.nom_pharmacie || "officine")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.json`,
      JSON.stringify(copie, null, 2),
      "application/json",
    );
  };

  const importer = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as FormState;
        replace({ ...emptyForm(), ...data });
      } catch {
        window.alert("Ce fichier n'est pas une sauvegarde valide du formulaire.");
      }
    };
    reader.readAsText(file);
  };

  const secteursAffiches = tousSecteurs
    ? Object.keys(MARQUES_PAR_SECTEUR)
    : Object.keys(MARQUES_PAR_SECTEUR).filter((s) => nomsPoles.includes(s));

  const ajouterGamme = (nom: string, secteur: string) => {
    update((d) => {
      if (d.gammes.some((g) => g.nom === nom)) {
        d.gammes = d.gammes.filter((g) => g.nom !== nom);
        return;
      }
      const g: Gamme = {
        id: uid(),
        nom,
        laboratoire: "",
        secteur,
        pole: nomsPoles.includes(secteur) ? secteur : nomsPoles[0] ?? secteur,
        statut: "",
        positionnement: "",
        lineaire_ml: "",
        descentes: "",
        emplacement: "",
        referent: "",
        ca_annuel: "",
        taux_marge: "",
        plan_trade: false,
        formation_labo: "",
        formations_par_an: "",
        commentaire: "",
        pilote: false,
        achat: emptyAchat(),
      };

      d.gammes.push(g);
      const dermoPilier = d.gammes.filter((x) => x.pole === "Dermo-cosmétique");
      if (!d.gammes.some((x) => x.pilote) && dermoPilier.length) dermoPilier[0].pilote = true;
    });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        surtitre="Onglet Formulaire"
        titre="Décris ton officine"
        intro="Dix blocs. Tout est enregistré en continu dans ce navigateur : rien n'est envoyé à un serveur. Les champs marqués d'un astérisque doré sont indispensables à la génération des prompts."
      />

      <div className="sticky top-[76px] z-40 mb-6 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-[var(--color-background)]/95 px-4 py-3 text-sm backdrop-blur sm:-mx-6 sm:px-6 lg:top-[68px]">
        <Badge color="var(--color-success)">
          {savedAt ? `Enregistré à ${savedAt}` : "Enregistrement automatique actif"}
        </Badge>
        <Button variant="secondary" onClick={() => loadDemo(demoForm())}>
          Charger un exemple
        </Button>
        <Button variant="secondary" onClick={() => {
            saveBackup();
            toast.success("La saisie a bien été sauvegardée");
          }}>
          Sauvegarder ma saisie
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
        {recoveryCount > 0 && (
          <Button
            variant="secondary"
            onClick={() => {
              if (window.confirm("Restaurer la dernière saisie valide enregistrée automatiquement ?")) {
                restoreLatestRecovery();
              }
            }}
          >
            Restaurer une saisie ({recoveryCount})
          </Button>
        )}
        <Button variant="secondary" onClick={exporter}>
          Exporter mon formulaire (.json)
        </Button>
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-muted">
          Reprendre depuis un fichier
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importer(e.target.files[0])}
          />
        </label>
        <Button
          variant="ghost"
          onClick={() => {
            if (window.confirm("Effacer tout le formulaire de ce navigateur ?")) reset();
          }}
        >
          Tout effacer
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {/* BLOC 1 */}
          <Section
            numero={1}
            titre="Identité de l'officine"
            intro="Ces informations nomment le projet, calibrent les objectifs et conditionnent le format d'import des ventes."
            rempli={rempli(...Object.values(form.identite))}
            total={20}
            defaultOpen
          >
            <Grid>
              <Text
                label="Nom commercial de la pharmacie"
                required
                value={form.identite.nom_pharmacie}
                onChange={(v) => update((d) => void (d.identite.nom_pharmacie = v))}
              />
              <Text
                label="Ville / département"
                value={form.identite.ville}
                onChange={(v) => update((d) => void (d.identite.ville = v))}
              />
              <Text
                label="Prénom du titulaire"
                required
                value={form.identite.prenom_titulaire}
                onChange={(v) => update((d) => void (d.identite.prenom_titulaire = v))}
              />
              <Text
                label="Nom du titulaire"
                required
                value={form.identite.nom_titulaire}
                onChange={(v) => update((d) => void (d.identite.nom_titulaire = v))}
              />
              <Text
                label="Nombre de titulaires / associés"
                type="number"
                value={form.identite.nb_titulaires}
                onChange={(v) => update((d) => void (d.identite.nb_titulaires = v))}
              />
              {Number(form.identite.nb_titulaires || "1") > 1 && (
                <Text
                  label="Autres titulaires (nom et prénom, séparés par une virgule)"
                  value={form.identite.cotitulaires}
                  onChange={(v) => update((d) => void (d.identite.cotitulaires = v))}
                />
              )}
              <Select
                label="Groupement ou enseigne"
                options={GROUPEMENTS}
                allowFree
                value={form.identite.groupement}
                onChange={(v) => update((d) => void (d.identite.groupement = v))}
              />
              <Select
                label="Logiciel de gestion d'officine (LGO)"
                options={LGOS}
                allowFree
                value={form.identite.lgo}
                onChange={(v) => update((d) => void (d.identite.lgo = v))}
              />
              <Text
                label="Chiffre d'affaires annuel TTC"
                suffix="€"
                value={form.identite.ca_annuel}
                onChange={(v) => update((d) => void (d.identite.ca_annuel = v))}
              />
              <Text
                label="Part du CA non remboursé (para + OTC)"
                suffix="%"
                value={form.identite.part_ca_para}
                onChange={(v) => update((d) => void (d.identite.part_ca_para = v))}
              />
              <Text
                label="Surface de vente"
                suffix="m²"
                value={form.identite.surface}
                onChange={(v) => update((d) => void (d.identite.surface = v))}
              />
              <Text
                label="Nombre de descentes murales"
                type="number"
                value={form.identite.nb_descentes}
                onChange={(v) => update((d) => void (d.identite.nb_descentes = v))}
              />
              <Text
                label="Nombre de gondoles"
                type="number"
                value={form.identite.nb_gondoles}
                onChange={(v) => update((d) => void (d.identite.nb_gondoles = v))}
              />
              <Text
                label="Nombre de têtes de gondole (TG)"
                type="number"
                value={form.identite.nb_tg}
                onChange={(v) => update((d) => void (d.identite.nb_tg = v))}
              />
              <Text
                label="Nombre de comptoirs ordonnance"
                type="number"
                value={form.identite.nb_comptoirs_ordonnance}
                onChange={(v) => update((d) => void (d.identite.nb_comptoirs_ordonnance = v))}
              />
              <Text
                label="Nombre de comptoirs para"
                type="number"
                value={form.identite.nb_comptoirs_para}
                onChange={(v) => update((d) => void (d.identite.nb_comptoirs_para = v))}
              />
              <Select
                label="Comptoir d'accueil"
                options={["Oui", "Non"]}
                value={form.identite.comptoir_accueil}
                onChange={(v) => update((d) => void (d.identite.comptoir_accueil = v))}
              />
              <Text
                label="Salles de confidentialité (vaccination, tests, contention, soins)"
                type="number"
                value={form.identite.nb_salles_confidentialite}
                onChange={(v) => update((d) => void (d.identite.nb_salles_confidentialite = v))}
              />
              <Text
                label="Écrans en surface de vente"
                type="number"
                value={form.identite.nb_ecrans_vente}
                onChange={(v) => update((d) => void (d.identite.nb_ecrans_vente = v))}
              />
              <Text
                label="Écrans en vitrine"
                type="number"
                value={form.identite.nb_ecrans_vitrine}
                onChange={(v) => update((d) => void (d.identite.nb_ecrans_vitrine = v))}
              />
              <Text
                label="Nombre de vitrines"
                type="number"
                value={form.identite.nb_vitrines}
                onChange={(v) => update((d) => void (d.identite.nb_vitrines = v))}
              />
            </Grid>
            <div className="mt-4">
              <Area
                label="Autres informations à ajouter (renseignements libres)"
                rows={4}
                placeholder="Tout élément utile : particularités du local, projets en cours, contraintes, patientèle spécifique…"
                value={form.identite.autres_infos}
                onChange={(v) => update((d) => void (d.identite.autres_infos = v))}
              />
            </div>
          </Section>

          {/* BLOC 2 */}
          <Section
            numero={2}
            titre="Pôles principaux et sous-pôles"
            intro="Les pôles principaux sont les univers affichés en page d'accueil de l'agent. Tu peux en mettre plus de 8, mais ce n'est pas recommandé. Chaque pôle principal peut contenir des sous-pôles."
            rempli={form.poles.filter((p) => p.nom.trim()).length}
            total={Math.max(form.poles.length, 1)}
          >
            <CheckGroup
              label="Pôles principaux (univers de la page d'accueil)"
              columns={3}
              options={Array.from(new Set([...POLES.map((p) => p.nom), ...nomsPoles]))}
              values={nomsPoles}
              onToggle={(nom) =>
                update((d) => {
                  if (nom === "Dermo-cosmétique") return;
                  const i = d.poles.findIndex((p) => p.nom === nom);
                  if (i >= 0) d.poles.splice(i, 1);
                  else
                    d.poles.push({
                      nom,
                      couleur: couleurPole(nom),
                      responsable: "",
                      poids: "",
                      objectif_progression: "",
                      priorite: "2",
                      sous_poles: [],
                    });
                })
              }
            />
            <AjoutLibre
              placeholder="Ajouter un pôle principal (ex. : Hygiène, Vétérinaire…)"
              onAdd={(nom) =>
                update((d) => {
                  if (d.poles.some((p) => p.nom.toLowerCase() === nom.toLowerCase())) return;
                  d.poles.push({
                    nom,
                    couleur: couleurPole(nom),
                    responsable: "",
                    poids: "",
                    objectif_progression: "",
                    priorite: "2",
                    sous_poles: [],
                  });
                })
              }
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Le pôle Dermo-cosmétique est le pôle pilote de la construction (brique 1) : il ne peut
              pas être décoché.
            </p>
            {form.poles.length > 8 ? (
              <p className="mt-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
                Tu as {form.poles.length} pôles principaux (les pôles au-delà du 8ᵉ sont signalés en
                couleur ci-dessous). C'est possible, mais non recommandé : au-delà de 8, la page
                d'accueil de l'agent devient illisible. Regroupe plutôt certains univers en
                sous-pôles (ex. « Maquillage », « Soins », « Capillaire » sous « Cosmétique »).
              </p>
            ) : null}



            <div className="mt-4 space-y-3">
              {form.poles.map((p, i) => (
                <div
                  key={p.nom}
                  className={`rounded-lg border p-3 ${i >= 8 ? "border-accent bg-accent/5" : "border-border"}`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: p.couleur }}
                      aria-hidden
                    />
                    <strong className="text-sm">{p.nom}</strong>
                    {i >= 8 ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                        au-delà de 8 — non recommandé
                      </span>
                    ) : null}
                  </div>
                  <Grid>
                    <Text
                      label="Nom du pôle"
                      value={p.nom}
                      onChange={(v) => update((d) => void (d.poles[i].nom = v))}
                    />
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Couleur
                      </span>
                      <input
                        type="color"
                        className="h-9 w-full rounded-lg border border-input bg-card"
                        value={p.couleur}
                        onChange={(e) => update((d) => void (d.poles[i].couleur = e.target.value))}
                      />
                    </label>
                    <div className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Responsable de pôle
                      </span>
                      <div className="flex h-9 items-center rounded-lg border border-dashed border-input bg-muted/30 px-3 text-sm">
                        {p.responsable || responsableAuto(p.nom) || (
                          <span className="text-muted-foreground">
                            Sera déterminé dans le bloc « Équipe »
                          </span>
                        )}
                      </div>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        Renseigné automatiquement depuis le bloc « Équipe » (responsabilité
                        « Responsable de pôle »).
                      </span>
                    </div>

                    <Text
                      label="Poids actuel dans le CA para"
                      suffix="%"
                      value={p.poids}
                      onChange={(v) => update((d) => void (d.poles[i].poids = v))}
                    />
                    <Text
                      label="Objectif de progression sur 12 mois"
                      suffix="%"
                      value={p.objectif_progression}
                      onChange={(v) => update((d) => void (d.poles[i].objectif_progression = v))}
                    />
                    <Select
                      label="Priorité stratégique"
                      options={["1", "2", "3"]}
                      value={p.priorite}
                      onChange={(v) => update((d) => void (d.poles[i].priorite = v))}
                    />
                  </Grid>
                  <div className="mt-3">
                    <SousPolesInput
                      pole={p.nom}
                      value={p.sous_poles ?? []}
                      onChange={(arr) => update((d) => void (d.poles[i].sous_poles = arr))}
                    />
                  </div>

                </div>

              ))}
            </div>
          </Section>

          {/* BLOC 3 */}
          <Section
            numero={3}
            titre="Cartographie des gammes par pôles"
            intro="Le bloc le plus important : coche les marques présentes, puis complète les fiches. Toute marque absente s'ajoute librement."
            rempli={form.gammes.filter((g) => g.statut && g.pole).length}
            total={Math.max(form.gammes.length, 1)}
          >
            <div className="space-y-4">
              {secteursAffiches.map((secteur) => {
                const selection = form.gammes.filter((g) => g.secteur === secteur);
                return (
                  <div key={secteur} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: couleurPole(secteur) }}
                      />
                      <strong className="text-sm">{secteur}</strong>
                    </div>
                    <CheckGroup
                      columns={3}
                      options={Array.from(
                        new Set([
                          ...(MARQUES_PAR_SECTEUR[secteur] ?? []),
                          ...selection.map((g) => g.nom).filter(Boolean),
                        ]),
                      )}
                      values={selection.map((g) => g.nom)}
                      onToggle={(nom) => ajouterGamme(nom, secteur)}
                    />
                    <AjoutLibre
                      placeholder={`Ajouter une marque dans « ${secteur} »`}
                      onAdd={(nom) => {
                        if (selection.some((g) => g.nom.toLowerCase() === nom.toLowerCase())) return;
                        ajouterGamme(nom, secteur);
                      }}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selection.length} marques sélectionnées
                    </p>


                  </div>
                );
              })}
              <Button variant="ghost" onClick={() => setTousSecteurs((v) => !v)}>
                {tousSecteurs ? "N'afficher que mes secteurs" : "Afficher tous les secteurs"}
              </Button>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const nom = window.prompt("Nom de la marque / gamme à ajouter");
                    if (nom) ajouterGamme(nom, nomsPoles[0] ?? "Dermo-cosmétique");
                  }}
                >
                  Ajouter une gamme libre
                </Button>
              </div>

              <div className="space-y-3">
                {form.gammes.map((g, i) => (
                  <details key={g.id} className="rounded-lg border border-border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      {g.nom}
                      {g.pilote ? (
                        <span className="ml-2">
                          <Badge color="var(--color-accent)">gamme pilote</Badge>
                        </span>
                      ) : null}
                      <span className="ml-2 text-xs text-muted-foreground">{g.pole}</span>
                    </summary>
                    <div className="mt-3">
                      <Grid>
                        <Text
                          label="Marque / gamme"
                          required
                          value={g.nom}
                          onChange={(v) => update((d) => void (d.gammes[i].nom = v))}
                        />
                        <Text
                          label="Laboratoire / fournisseur"
                          value={g.laboratoire}
                          onChange={(v) => update((d) => void (d.gammes[i].laboratoire = v))}
                        />
                        <Select
                          label="Pôle de rattachement"
                          required
                          options={nomsPoles}
                          value={g.pole}
                          onChange={(v) => update((d) => void (d.gammes[i].pole = v))}
                        />
                        <Select
                          label="Statut"
                          options={STATUTS_GAMME}
                          value={g.statut}
                          onChange={(v) => update((d) => void (d.gammes[i].statut = v))}
                        />
                        <Select
                          label="Positionnement prix"
                          options={POSITIONNEMENTS_GAMME}
                          value={g.positionnement}
                          onChange={(v) => update((d) => void (d.gammes[i].positionnement = v))}
                        />
                        <Text
                          label="Linéaire occupé"
                          suffix="ml"
                          value={g.lineaire_ml}
                          onChange={(v) => update((d) => void (d.gammes[i].lineaire_ml = v))}
                        />
                        <Text
                          label="Nombre de descentes"
                          value={g.descentes}
                          onChange={(v) => update((d) => void (d.gammes[i].descentes = v))}
                        />
                        <Select
                          label="Emplacement"
                          options={EMPLACEMENTS}
                          value={g.emplacement}
                          onChange={(v) => update((d) => void (d.gammes[i].emplacement = v))}
                        />
                        <Select
                          label="Référent gamme"
                          options={nomsCollaborateurs}
                          allowFree
                          value={g.referent}
                          onChange={(v) => update((d) => void (d.gammes[i].referent = v))}
                        />
                        <Text
                          label="CA annuel estimé"
                          suffix="€"
                          value={g.ca_annuel}
                          onChange={(v) => update((d) => void (d.gammes[i].ca_annuel = v))}
                        />
                        <Text
                          label="Taux de marge moyen"
                          suffix="%"
                          value={g.taux_marge}
                          onChange={(v) => update((d) => void (d.gammes[i].taux_marge = v))}
                        />
                        <Select
                          label="Le labo propose des formations"
                          options={["Oui", "Non"]}
                          value={g.formation_labo}
                          onChange={(v) => update((d) => void (d.gammes[i].formation_labo = v))}
                        />
                        {g.formation_labo === "Oui" && (
                          <Text
                            label="Fréquence des formations (par an)"
                            suffix="/an"
                            value={g.formations_par_an ?? ""}
                            onChange={(v) => update((d) => void (d.gammes[i].formations_par_an = v))}
                          />
                        )}
                      </Grid>
                      <AchatGammeBloc index={i} achat={g.achat ?? emptyAchat()} update={update} />
                      <div className="mt-3 space-y-2">
                        <Checkbox
                          checked={g.plan_trade}
                          onChange={(v) => update((d) => void (d.gammes[i].plan_trade = v))}
                        >
                          Contrat / plan trade en cours (la gamme apparaîtra au bloc 6)
                        </Checkbox>
                        <Checkbox
                          checked={g.pilote}
                          onChange={(v) =>
                            update((d) => {
                              d.gammes.forEach((x) => (x.pilote = false));
                              d.gammes[i].pilote = v;
                            })
                          }
                        >
                          Gamme pilote de la construction (réservée au pôle Dermo-cosmétique, une
                          seule pour tout le formulaire)
                        </Checkbox>
                        <Area
                          label="Commentaire"
                          rows={2}
                          value={g.commentaire}
                          onChange={(v) => update((d) => void (d.gammes[i].commentaire = v))}
                        />
                        <div className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => update((d) => void d.gammes.splice(i, 1))}
                          >
                            Retirer cette gamme
                          </Button>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </Section>

          {/* BLOC 4 */}
          <Section
            numero={4}
            titre="Spécialités et positionnement"
            intro="Ce bloc donne à l'agent la personnalité commerciale de ton officine : ton, priorités, arguments."
            rempli={rempli(
              form.positionnement.axes,
              form.positionnement.services,
              form.positionnement.prix,
              form.positionnement.typologie_clientele,
              form.positionnement.force_distinctive,
            )}
            total={5}
          >
            <div className="space-y-5">
              <CheckGroup
                label="Axes de différenciation"
                columns={2}
                options={AXES_DIFFERENCIATION}
                values={form.positionnement.axes}
                onToggle={(v) =>
                  update((d) => {
                    const i = d.positionnement.axes.indexOf(v);
                    i >= 0 ? d.positionnement.axes.splice(i, 1) : d.positionnement.axes.push(v);
                  })
                }
              />
              <CheckGroup
                label="Services proposés"
                columns={2}
                options={SERVICES_PROPOSES}
                values={form.positionnement.services}
                onToggle={(v) =>
                  update((d) => {
                    const i = d.positionnement.services.indexOf(v);
                    i >= 0
                      ? d.positionnement.services.splice(i, 1)
                      : d.positionnement.services.push(v);
                  })
                }
              />
              <Radio
                label="Positionnement prix"
                options={["premium", "équilibré", "accessible", "discount"]}
                value={form.positionnement.prix}
                onChange={(v) => update((d) => void (d.positionnement.prix = v))}
              />
              <CheckGroup
                label="Typologie de clientèle"
                columns={2}
                options={TYPOLOGIES_CLIENTELE}
                values={form.positionnement.typologie_clientele
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)}
                onToggle={(v) =>
                  update((d) => {
                    const list = d.positionnement.typologie_clientele
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const i = list.indexOf(v);
                    i >= 0 ? list.splice(i, 1) : list.push(v);
                    d.positionnement.typologie_clientele = list.join(", ");
                  })
                }
              />
              <Area
                label="Ce que ton officine fait mieux que les autres"
                rows={5}
                value={form.positionnement.force_distinctive}
                onChange={(v) => update((d) => void (d.positionnement.force_distinctive = v))}
              />
            </div>
          </Section>

          {/* BLOC 5 */}
          <Section
            numero={5}
            titre="Équipe"
            intro="Nom, prénom, rôle et rattachement suffisent. Les objectifs individuels et les résultats se saisiront dans l'agent, à la brique 4."
            rempli={form.equipe.filter((c) => c.nom && c.prenom && c.role).length}
            total={Math.max(form.equipe.length, 1)}
          >
            <div className="space-y-3">
              {form.equipe.map((c, i) => {
                const ferme = equipeFermee[c.id] ?? false;
                return (
                <div key={c.id} className="rounded-lg border border-border p-3">
                  <Grid>
                    <Text
                      label="Prénom"
                      required
                      value={c.prenom}
                      onChange={(v) => update((d) => void (d.equipe[i].prenom = v))}
                    />
                    <Text
                      label="Nom"
                      required
                      value={c.nom}
                      onChange={(v) => update((d) => void (d.equipe[i].nom = v))}
                    />
                  </Grid>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setEquipeFermee((s) => ({ ...s, [c.id]: !ferme }))
                      }
                    >
                      {ferme ? "▾ Ouvrir la fiche" : "▴ Fermer la fiche"}
                    </Button>
                  </div>
                  {ferme ? null : (
                  <>
                  <Grid>
                    <Select
                      label="Rôle"
                      required
                      options={ROLES_EQUIPE}
                      value={c.role}
                      onChange={(v) => update((d) => void (d.equipe[i].role = v))}
                    />
                    <Select
                      label="Pôle principal"
                      options={Array.from(
                        new Set([...nomsPoles, "Espace parapharmacie (transversal)", "Administratif"]),
                      )}
                      allowFree
                      value={c.pole}
                      onChange={(v) => update((d) => void (d.equipe[i].pole = v))}
                    />
                    <Select
                      label="Responsabilité trade"
                      options={RESPONSABILITES_TRADE}
                      value={c.responsabilite}
                      onChange={(v) => update((d) => void (d.equipe[i].responsabilite = v))}
                    />
                    <Text
                      label="Temps hebdomadaire dédié au trade"
                      suffix="h"
                      value={c.heures_trade}
                      onChange={(v) => update((d) => void (d.equipe[i].heures_trade = v))}
                    />
                  </Grid>
                  {(c.pole ? sousPolesDuPole(c.pole) : tousSousPoles).length ? (
                    <div className="mt-3">
                      <CheckGroup
                        label={
                          c.pole
                            ? `Sous-pôles gérés (pôle « ${c.pole} »)`
                            : "Sous-pôles gérés"
                        }
                        columns={3}
                        options={c.pole ? sousPolesDuPole(c.pole) : tousSousPoles}
                        values={c.sous_poles_geres ?? []}
                        onToggle={(v) =>
                          update((d) => {
                            const arr = d.equipe[i].sous_poles_geres ?? [];
                            const k = arr.indexOf(v);
                            k >= 0 ? arr.splice(k, 1) : arr.push(v);
                            d.equipe[i].sous_poles_geres = arr;
                          })
                        }
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Aucun sous-pôle défini : ajoute-les dans le bloc 2 « Pôles principaux et
                      sous-pôles » pour pouvoir les attribuer ici.
                    </p>
                  )}
                  {(() => {
                    const sel = c.sous_poles
                      ? c.sous_poles.split(",").map((x) => x.trim()).filter(Boolean)
                      : [];
                    const opts = [...nomsGammes, ...sel.filter((v) => !nomsGammes.includes(v))];
                    const setSel = (arr: string[]) =>
                      update((d) => {
                        d.equipe[i].sous_poles = arr.join(", ");
                      });
                    return (
                      <div className="mt-3">
                        {opts.length ? (
                          <CheckGroup
                            label="Responsables Marques"
                            columns={3}
                            options={opts}
                            values={sel}
                            onToggle={(v) =>
                              setSel(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v])
                            }
                          />
                        ) : (
                          <Label>Responsables Marques</Label>
                        )}
                        <AjoutLibre
                          placeholder="Ajouter une marque (saisie libre)"
                          onAdd={(v) => {
                            if (!sel.includes(v)) setSel([...sel, v]);
                          }}
                        />
                      </div>
                    );
                  })()}

                  {nomsGammes.length ? (
                    <div className="mt-3">
                      <CheckGroup
                        label="Gammes référentes"
                        columns={3}
                        options={nomsGammes}
                        values={c.gammes_referentes}
                        onToggle={(v) =>
                          update((d) => {
                            const arr = d.equipe[i].gammes_referentes;
                            const k = arr.indexOf(v);
                            k >= 0 ? arr.splice(k, 1) : arr.push(v);
                          })
                        }
                      />
                    </div>
                  ) : null}
                  </>
                  )}
                  <div className="mt-3 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => update((d) => void d.equipe.splice(i, 1))}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
                );
              })}
              <Button
                onClick={() =>
                  update((d) =>
                    void d.equipe.push({
                      id: uid(),
                      nom: "",
                      prenom: "",
                      role: "",
                      pole: "",
                      sous_poles: "",
                      sous_poles_geres: [],
                      gammes_referentes: [],
                      responsabilite: "Aucune",
                      heures_trade: "",
                      date_entree: "",
                    }),
                  )
                }
              >
                Ajouter un collaborateur
              </Button>
            </div>
          </Section>

          {/* BLOC 6 */}
          <Section
            numero={6}
            titre="Plans trade et accords laboratoires"
            intro="Un accord par ligne : paliers, avantages, contreparties engagées et date de revue."
            rempli={form.plans.filter((p) => p.laboratoire && p.objectif_achat).length}
            total={Math.max(form.plans.length, 1)}
          >
            <Encadre type="vigilance">
              <p>
                Les avantages consentis par un laboratoire relèvent du dispositif « anti-cadeaux »
                (art. L.1453-3 et suivants du Code de la santé publique). Le principe est
                l'interdiction. Deux régimes dérogatoires coexistent : la déclaration, pour les
                avantages inférieurs aux seuils fixés par arrêté, déposée au moins huit jours avant
                l'octroi ; l'autorisation au-delà de ces seuils, l'ordre disposant de deux mois pour
                se prononcer. Le dépôt se fait par la télé-procédure nationale unique.
              </p>
              <p>
                Les remises d'achat relevant de relations commerciales normales sont exclues du
                dispositif ; les remises sur médicaments remboursables restent plafonnées par l'art.
                L.138-9 du Code de la sécurité sociale. Dotations, invitations, hospitalité,
                formations et challenges relèvent, eux, du dispositif anti-cadeaux. En cas de doute :
                convention et dépôt.
              </p>
            </Encadre>

            <div className="space-y-3">
              {form.plans.map((p, i) => (
                <div key={p.id} className="rounded-lg border border-border p-3">
                  <Grid>
                    <Text
                      label="Laboratoire"
                      required
                      value={p.laboratoire}
                      onChange={(v) => update((d) => void (d.plans[i].laboratoire = v))}
                    />
                    <Select
                      label="Type d'accord"
                      options={TYPES_ACCORD}
                      value={p.type_accord}
                      onChange={(v) => update((d) => void (d.plans[i].type_accord = v))}
                    />
                    <Text
                      label="Début"
                      placeholder="JJ/MM/AAAA"
                      value={p.debut}
                      onChange={(v) => update((d) => void (d.plans[i].debut = v))}
                    />
                    <Text
                      label="Fin"
                      placeholder="JJ/MM/AAAA"
                      value={p.fin}
                      onChange={(v) => update((d) => void (d.plans[i].fin = v))}
                    />
                    <Text
                      label="Interlocuteur"
                      value={p.interlocuteur}
                      onChange={(v) => update((d) => void (d.plans[i].interlocuteur = v))}
                    />
                    <Text
                      label="Objectif d'achat ou de sell-out"
                      suffix="€"
                      value={p.objectif_achat}
                      onChange={(v) => update((d) => void (d.plans[i].objectif_achat = v))}
                    />
                    <Text
                      label="Remise sur facture"
                      suffix="%"
                      value={p.remise_facture}
                      onChange={(v) => update((d) => void (d.plans[i].remise_facture = v))}
                    />
                    <Text
                      label="Remise différée (RFA)"
                      suffix="%"
                      value={p.rfa}
                      onChange={(v) => update((d) => void (d.plans[i].rfa = v))}
                    />
                    <Text
                      label="Unités gratuites (UG)"
                      placeholder="12+2"
                      value={p.ug}
                      onChange={(v) => update((d) => void (d.plans[i].ug = v))}
                    />
                    <Text
                      label="Budget PLV / animation"
                      suffix="€"
                      value={p.budget_plv}
                      onChange={(v) => update((d) => void (d.plans[i].budget_plv = v))}
                    />
                    <Text
                      label="Budget formation"
                      value={p.budget_formation}
                      onChange={(v) => update((d) => void (d.plans[i].budget_formation = v))}
                    />
                    <Text
                      label="Date de revue"
                      placeholder="JJ/MM/AAAA"
                      value={p.date_revue}
                      onChange={(v) => update((d) => void (d.plans[i].date_revue = v))}
                    />
                    <Select
                      label="Convention déclarée à l'Ordre"
                      options={["Oui", "Non", "Sans objet"]}
                      value={p.convention}
                      onChange={(v) => update((d) => void (d.plans[i].convention = v))}
                    />
                  </Grid>

                  <div className="mt-3 space-y-3">
                    <CheckGroup
                      label="Gammes concernées"
                      columns={3}
                      options={nomsGammes}
                      values={p.gammes}
                      onToggle={(v) =>
                        update((d) => {
                          const arr = d.plans[i].gammes;
                          const k = arr.indexOf(v);
                          k >= 0 ? arr.splice(k, 1) : arr.push(v);
                        })
                      }
                    />
                    <CheckGroup
                      label="Contreparties engagées par l'officine"
                      columns={2}
                      options={CONTREPARTIES}
                      values={p.contreparties}
                      onToggle={(v) =>
                        update((d) => {
                          const arr = d.plans[i].contreparties;
                          const k = arr.indexOf(v);
                          k >= 0 ? arr.splice(k, 1) : arr.push(v);
                        })
                      }
                    />
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Structure des paliers
                      </p>
                      {p.paliers.map((pal, j) => (
                        <div key={j} className="mb-2 flex gap-2">
                          <input
                            className="field"
                            placeholder="Seuil (€)"
                            value={pal.seuil}
                            onChange={(e) =>
                              update((d) => void (d.plans[i].paliers[j].seuil = e.target.value))
                            }
                          />
                          <input
                            className="field"
                            placeholder="Avantage obtenu"
                            value={pal.avantage}
                            onChange={(e) =>
                              update((d) => void (d.plans[i].paliers[j].avantage = e.target.value))
                            }
                          />
                          <Button
                            variant="ghost"
                            onClick={() => update((d) => void d.plans[i].paliers.splice(j, 1))}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() =>
                          update((d) => void d.plans[i].paliers.push({ seuil: "", avantage: "" }))
                        }
                      >
                        Ajouter un palier
                      </Button>
                    </div>
                    <Area
                      label="Commentaire"
                      rows={2}
                      value={p.commentaire}
                      onChange={(v) => update((d) => void (d.plans[i].commentaire = v))}
                    />
                    <div className="text-right">
                      <Button variant="ghost" onClick={() => update((d) => void d.plans.splice(i, 1))}>
                        Supprimer ce plan
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                onClick={() =>
                  update((d) =>
                    void d.plans.push({
                      id: uid(),
                      laboratoire: "",
                      gammes: [],
                      type_accord: "",
                      debut: "",
                      fin: "",
                      interlocuteur: "",
                      objectif_achat: "",
                      paliers: [{ seuil: "", avantage: "" }],
                      remise_facture: "",
                      rfa: "",
                      ug: "",
                      budget_plv: "",
                      budget_formation: "",
                      contreparties: [],
                      date_revue: "",
                      convention: "",
                      commentaire: "",
                    }),
                  )
                }
              >
                Ajouter un plan trade
              </Button>
            </div>
          </Section>

          {/* BLOC 7 */}
          <Section
            numero={7}
            titre="Objectifs et indicateurs"
            intro="Ce que l'agent doit calculer, à quelle fréquence, et la saisonnalité qui rythmera le plan d'animation."
            rempli={rempli(
              form.objectifs.objectif_ca_annuel,
              form.objectifs.objectif_marge_global,
              form.objectifs.indicateurs.length >= 4 ? "ok" : "",
              form.objectifs.periodicite,
            )}
            total={4}
          >
            <Grid>
              <Text
                label="Objectif de CA para + OTC sur 12 mois"
                suffix="€"
                value={form.objectifs.objectif_ca_annuel}
                onChange={(v) => update((d) => void (d.objectifs.objectif_ca_annuel = v))}
              />
              <Text
                label="Objectif de taux de marge global"
                suffix="%"
                value={form.objectifs.objectif_marge_global}
                onChange={(v) => update((d) => void (d.objectifs.objectif_marge_global = v))}
              />
            </Grid>

            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Objectifs par pôle (%)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {form.poles.map((p) => (
                  <label key={p.nom} className="flex items-center gap-2 text-sm">
                    <span className="w-48 shrink-0 truncate">{p.nom}</span>
                    <input
                      className="field"
                      value={form.objectifs.objectifs_poles[p.nom] ?? ""}
                      onChange={(e) =>
                        update((d) => void (d.objectifs.objectifs_poles[p.nom] = e.target.value))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <CheckGroup
                label="Indicateurs à suivre (au moins 4)"
                columns={2}
                options={INDICATEURS}
                values={form.objectifs.indicateurs}
                onToggle={(v) =>
                  update((d) => {
                    const arr = d.objectifs.indicateurs;
                    const k = arr.indexOf(v);
                    k >= 0 ? arr.splice(k, 1) : arr.push(v);
                  })
                }
              />
            </div>

            <div className="mt-4">
              <Radio
                label="Périodicité de pilotage"
                options={["hebdomadaire", "mensuelle", "trimestrielle"]}
                value={form.objectifs.periodicite}
                onChange={(v) => update((d) => void (d.objectifs.periodicite = v))}
              />
            </div>

            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Saisonnalité (pré-remplie, modifiable)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {form.objectifs.saisonnalite.map((m, i) => (
                  <label key={m.mois} className="flex items-center gap-2 text-sm">
                    <span className="w-24 shrink-0">{m.mois}</span>
                    <input
                      className="field"
                      value={m.poles}
                      onChange={(e) =>
                        update((d) => void (d.objectifs.saisonnalite[i].poles = e.target.value))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* BLOC 8 */}
          <Section
            numero={8}
            titre="Motivation et primes de l'équipe"
            intro="Le moteur de primes de la brique 4 se calibrera exactement sur ce que tu décris ici."
            rempli={rempli(
              form.primes.dispositif,
              form.primes.assiette,
              form.primes.perimetre,
              form.primes.periodicite,
              form.primes.paliers.length ? "ok" : "",
              form.primes.validateur,
            )}
            total={6}
          >
            <div className="space-y-4">
              <Radio
                label="Un dispositif de primes existe-t-il ?"
                options={["Oui", "Non", "En projet"]}
                value={form.primes.dispositif}
                onChange={(v) => update((d) => void (d.primes.dispositif = v))}
              />
              <Grid>
                <Select
                  label="Assiette de calcul"
                  options={["CA HT", "CA TTC", "marge brute", "nombre d'unités", "mix"]}
                  value={form.primes.assiette}
                  onChange={(v) => update((d) => void (d.primes.assiette = v))}
                />
                <Select
                  label="Périmètre"
                  options={["individuel", "par pôle", "collectif officine", "mixte"]}
                  value={form.primes.perimetre}
                  onChange={(v) => update((d) => void (d.primes.perimetre = v))}
                />
                <Select
                  label="Périodicité de versement"
                  options={["mensuelle", "trimestrielle", "semestrielle", "annuelle"]}
                  value={form.primes.periodicite}
                  onChange={(v) => update((d) => void (d.primes.periodicite = v))}
                />
                <Text
                  label="Plafond de prime par période"
                  suffix="€"
                  value={form.primes.plafond}
                  onChange={(v) => update((d) => void (d.primes.plafond = v))}
                />
                <Text
                  label="Part collective"
                  suffix="%"
                  value={form.primes.part_collective}
                  onChange={(v) => update((d) => void (d.primes.part_collective = v))}
                />
                <Select
                  label="Qui valide la prime"
                  options={["titulaire", "adjoint", "comptable"]}
                  value={form.primes.validateur}
                  onChange={(v) => update((d) => void (d.primes.validateur = v))}
                />
              </Grid>

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Structure des paliers de prime
                </p>
                {form.primes.paliers.map((pal, j) => (
                  <div key={j} className="mb-2 flex gap-2">
                    <input
                      className="field"
                      placeholder="Seuil atteint"
                      value={pal.seuil}
                      onChange={(e) => update((d) => void (d.primes.paliers[j].seuil = e.target.value))}
                    />
                    <input
                      className="field"
                      placeholder="Montant ou pourcentage"
                      value={pal.avantage}
                      onChange={(e) =>
                        update((d) => void (d.primes.paliers[j].avantage = e.target.value))
                      }
                    />
                    <Button variant="ghost" onClick={() => update((d) => void d.primes.paliers.splice(j, 1))}>
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() => update((d) => void d.primes.paliers.push({ seuil: "", avantage: "" }))}
                >
                  Ajouter un palier
                </Button>
              </div>

              <Radio
                label="Challenges internes"
                options={["Oui", "Non"]}
                value={form.primes.challenges}
                onChange={(v) => update((d) => void (d.primes.challenges = v))}
              />
              {form.primes.challenges === "Oui" ? (
                <>
                  <Grid>
                    <Text
                      label="Thème"
                      value={form.primes.challenge_theme}
                      onChange={(v) => update((d) => void (d.primes.challenge_theme = v))}
                    />
                    <Text
                      label="Durée"
                      value={form.primes.challenge_duree}
                      onChange={(v) => update((d) => void (d.primes.challenge_duree = v))}
                    />
                  </Grid>
                  <CheckGroup
                    label="Récompenses"
                    columns={3}
                    options={RECOMPENSES_CHALLENGE}
                    values={form.primes.recompenses}
                    onToggle={(v) =>
                      update((d) => {
                        const arr = d.primes.recompenses;
                        const k = arr.indexOf(v);
                        k >= 0 ? arr.splice(k, 1) : arr.push(v);
                      })
                    }
                  />
                </>
              ) : null}

              <CheckGroup
                label="Critères qualitatifs pris en compte"
                columns={2}
                options={CRITERES_QUALITATIFS}
                values={form.primes.criteres}
                onToggle={(v) =>
                  update((d) => {
                    const arr = d.primes.criteres;
                    const k = arr.indexOf(v);
                    k >= 0 ? arr.splice(k, 1) : arr.push(v);
                  })
                }
              />
              <Area
                label="Commentaire libre sur les règles internes"
                value={form.primes.commentaire}
                onChange={(v) => update((d) => void (d.primes.commentaire = v))}
              />

              <Encadre type="vigilance">
                <p>
                  La prime est versée par l'officine à son salarié, dans le cadre du contrat de
                  travail. La CCN de la pharmacie d'officine (IDCC 1996) fixe les minima et les
                  coefficients, non les dispositifs de rémunération variable : les points réellement
                  opposables sont l'égalité de traitement entre salariés placés dans une situation
                  comparable, le risque de transformation d'une prime récurrente en usage
                  d'entreprise, et le formalisme de dénonciation d'un tel usage. Un avantage financier
                  versé directement par un laboratoire à un membre de l'équipe relève, lui, du
                  dispositif anti-cadeaux. L'agent calcule et propose ; le titulaire décide et
                  transmet au gestionnaire de paie.
                </p>
              </Encadre>
            </div>
          </Section>

          {/* BLOC 9 */}
          <Section
            numero={9}
            titre="Merchandising et animation"
            intro="Vitrines, têtes de gondole, zones chaudes et types d'animation alimentent la brique 6."
            rempli={rempli(
              form.merch.emplacement_vitrines,
              form.merch.frequence_vitrine,
              form.merch.nb_tg,
              form.merch.zones_chaudes,
              form.merch.types_animation,
              form.merch.plv,
              form.merch.poseur,
            )}
            total={7}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nombre de vitrines (repris du bloc 1) :{" "}
                <strong>{form.identite.nb_vitrines || "—"}</strong>
              </p>
              <CheckGroup
                label="Emplacement des vitrines"
                columns={3}
                options={["rue", "intérieur", "comptoir"]}
                values={form.merch.emplacement_vitrines}
                onToggle={(v) =>
                  update((d) => {
                    const arr = d.merch.emplacement_vitrines;
                    const k = arr.indexOf(v);
                    k >= 0 ? arr.splice(k, 1) : arr.push(v);
                  })
                }
              />
              <Grid>
                <Select
                  label="Fréquence de changement de vitrine"
                  options={["hebdomadaire", "bimensuelle", "mensuelle", "saisonnière"]}
                  value={form.merch.frequence_vitrine}
                  onChange={(v) => update((d) => void (d.merch.frequence_vitrine = v))}
                />
                <Text
                  label="Nombre de têtes de gondole"
                  value={form.merch.nb_tg}
                  onChange={(v) => update((d) => void (d.merch.nb_tg = v))}
                />
                <Select
                  label="Plan d'animation annuel existant"
                  options={["Oui", "Non"]}
                  value={form.merch.plan_annuel}
                  onChange={(v) => update((d) => void (d.merch.plan_annuel = v))}
                />
                <Select
                  label="Qui pose les vitrines et les implantations"
                  options={nomsCollaborateurs}
                  allowFree
                  value={form.merch.poseur}
                  onChange={(v) => update((d) => void (d.merch.poseur = v))}
                />
                <Select
                  label="Photos d'implantation à archiver"
                  options={["Oui", "Non"]}
                  value={form.merch.archivage_photos}
                  onChange={(v) => update((d) => void (d.merch.archivage_photos = v))}
                />
              </Grid>
              <Area
                label="Zones chaudes identifiées"
                value={form.merch.zones_chaudes}
                onChange={(v) => update((d) => void (d.merch.zones_chaudes = v))}
              />
              <CheckGroup
                label="Types d'animation pratiqués"
                columns={2}
                options={TYPES_ANIMATION}
                values={form.merch.types_animation}
                onToggle={(v) =>
                  update((d) => {
                    const arr = d.merch.types_animation;
                    const k = arr.indexOf(v);
                    k >= 0 ? arr.splice(k, 1) : arr.push(v);
                  })
                }
              />
              <CheckGroup
                label="PLV disponibles"
                columns={3}
                options={PLV_DISPONIBLES}
                values={form.merch.plv}
                onToggle={(v) =>
                  update((d) => {
                    const arr = d.merch.plv;
                    const k = arr.indexOf(v);
                    k >= 0 ? arr.splice(k, 1) : arr.push(v);
                  })
                }
              />
            </div>
          </Section>

          {/* BLOC 10 */}
          <Section
            numero={10}
            titre="Briques optionnelles et paramètres"
            intro="Chaque case cochée génère un prompt d'extension dédié dans l'onglet Prompts."
            rempli={rempli(form.options.mode_import, form.options.nb_mois_historique)}
            total={2}
          >
            <div className="space-y-4">
              <CheckGroup
                columns={1}
                options={EXTENSIONS.map((e) => e.titre)}
                values={EXTENSIONS.filter((e) => form.options.extensions.includes(e.cle)).map(
                  (e) => e.titre,
                )}
                onToggle={(titre) =>
                  update((d) => {
                    const ext = EXTENSIONS.find((e) => e.titre === titre);
                    if (!ext) return;
                    const k = d.options.extensions.indexOf(ext.cle);
                    k >= 0 ? d.options.extensions.splice(k, 1) : d.options.extensions.push(ext.cle);
                  })
                }
              />
              <Radio
                label="Import des ventes"
                options={["fichier CSV/Excel exporté du LGO", "saisie manuelle mensuelle", "les deux"]}
                value={form.options.mode_import}
                onChange={(v) => update((d) => void (d.options.mode_import = v))}
              />
              <Radio
                label="Nombre de mois d'historique à gérer"
                options={["12", "24", "36"]}
                value={form.options.nb_mois_historique}
                onChange={(v) => update((d) => void (d.options.nb_mois_historique = v))}
              />
              <p className="text-xs text-muted-foreground">
                Devise et format de date : € et JJ/MM/AAAA (fixe).
              </p>
            </div>
          </Section>

          {/* Rattachements + génération */}
          <Card className="p-5">
            <h2 className="font-display text-xl font-semibold">Compléter les rattachements</h2>
            {liensManquants.length ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  {liensManquants.length} liens restés vides. Tu peux les compléter maintenant ou plus
                  tard, directement dans l'agent.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {liensManquants.slice(0, 12).map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                  {liensManquants.length > 12 ? (
                    <li>… et {liensManquants.length - 12} autres.</li>
                  ) : null}
                </ul>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Tous les rattachements sont renseignés. Tu peux générer tes prompts.
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => navigate({ to: "/prompts" })}
                disabled={!obligatoiresOk}
                variant="accent"
              >
                Générer mes prompts
              </Button>
              {!obligatoiresOk ? (
                <span className="text-sm text-muted-foreground">
                  Renseigne au minimum le nom de la pharmacie, le nom du titulaire et une gamme.
                </span>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Prévisualisation en direct */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              onClick={() => setApercuOuvert((v) => !v)}
            >
              <span className="text-sm font-semibold">Aperçu en direct du Prompt maître</span>
              <span className="text-muted-foreground">{apercuOuvert ? "▲" : "▼"}</span>
            </button>
            {apercuOuvert ? (
              <div className="border-t border-border">
                <div className="px-4 py-2">
                  <Progress
                    value={Math.min(100, (apercu.split(/\s+/).length / 1200) * 100)}
                    label={`${apercu.split(/\s+/).filter(Boolean).length} mots (limite conseillée : 1 200)`}
                  />
                </div>
                <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap px-4 pb-4 text-xs leading-relaxed text-muted-foreground">
                  {apercu.slice(0, 4000)}
                </pre>
              </div>
            ) : null}
          </Card>
        </aside>
      </div>
    </main>
  );
}

function AjoutLibre({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (v: string) => void;
}) {
  const [texte, setTexte] = useState("");
  const ajouter = () => {
    const v = texte.trim();
    if (!v) return;
    onAdd(v);
    setTexte("");
  };
  return (
    <div className="mt-3 flex gap-2">
      <input
        className="field flex-1"
        placeholder={placeholder}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            ajouter();
          }
        }}
      />
      <Button type="button" variant="ghost" onClick={ajouter}>
        + Ajouter
      </Button>
    </div>
  );
}

function SousPolesInput({
  pole,
  value,
  onChange,
}: {
  pole: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const suggestions = (SOUS_POLES_SUGGERES[pole] ?? []).filter(
    (s) => !value.some((x) => x.toLowerCase() === s.toLowerCase()),
  );
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        Sous-pôles de « {pole} »
      </span>
      {value.length ? (
        <div className="flex flex-wrap gap-2">
          {value.map((s, k) => (
            <span
              key={s + k}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs"
            >
              {s}
              <button
                type="button"
                aria-label={`Retirer ${s}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onChange(value.filter((_, j) => j !== k))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Aucun sous-pôle. Ex. : Maquillage, Soins visage, Capillaire.
        </p>
      )}
      {suggestions.length ? (
        <div className="mt-2">
          <span className="mb-1 block text-[11px] text-muted-foreground">
            Sous-pôles suggérés (clique pour ajouter) :
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-full border border-dashed border-input px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                onClick={() => onChange([...value, s])}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <AjoutLibre
        placeholder="Ajouter un sous-pôle"
        onAdd={(v) => {
          if (value.some((x) => x.toLowerCase() === v.toLowerCase())) return;
          onChange([...value, v]);
        }}
      />

    </div>
  );
}


function AchatGammeBloc({
  index,
  achat,
  update,
}: {
  index: number;
  achat: AchatGamme;
  update: (fn: (draft: FormState) => void) => void;
}) {
  const set = (fn: (a: AchatGamme) => void) =>
    update((d) => {
      const g = d.gammes[index];
      if (!g.achat) g.achat = emptyAchat();
      fn(g.achat);
    });

  return (
    <div className="mt-4 rounded-lg border border-border bg-[var(--color-primary-soft)]/30 p-3">
      <p className="mb-3 text-sm font-semibold">Achat</p>
      <Grid>
        <Text
          label="Code client"
          value={achat.code_client ?? ""}
          onChange={(v) => set((a) => void (a.code_client = v))}
        />
        <div />
        <Text
          label="Prénom du représentant"
          value={achat.representant_prenom}
          onChange={(v) => set((a) => void (a.representant_prenom = v))}
        />
        <Text
          label="Nom du représentant"
          value={achat.representant_nom}
          onChange={(v) => set((a) => void (a.representant_nom = v))}
        />
        <Text
          label="Téléphone représentant"
          value={achat.representant_tel}
          onChange={(v) => set((a) => void (a.representant_tel = v))}
        />
        <Text
          label="Mail représentant"
          value={achat.representant_mail}
          onChange={(v) => set((a) => void (a.representant_mail = v))}
        />
        <Text
          label="Prénom du directeur régional"
          value={achat.dr_prenom ?? ""}
          onChange={(v) => set((a) => void (a.dr_prenom = v))}
        />
        <Text
          label="Nom du directeur régional"
          value={achat.dr_nom ?? ""}
          onChange={(v) => set((a) => void (a.dr_nom = v))}
        />
        <Text
          label="Téléphone directeur régional"
          value={achat.dr_tel ?? ""}
          onChange={(v) => set((a) => void (a.dr_tel = v))}
        />
        <Text
          label="Mail directeur régional"
          value={achat.dr_mail ?? ""}
          onChange={(v) => set((a) => void (a.dr_mail = v))}
        />
        <Text
          label="Téléphone laboratoire"
          value={achat.labo_tel}
          onChange={(v) => set((a) => void (a.labo_tel = v))}
        />
        <Text
          label="Mail laboratoire"
          value={achat.labo_mail}
          onChange={(v) => set((a) => void (a.labo_mail = v))}
        />
        <Text
          label="Remise de base (toute la marque)"
          suffix="%"
          value={achat.remise_base ?? ""}
          onChange={(v) => set((a) => void (a.remise_base = v))}
        />
        <Text
          label="Franco de port"
          suffix="€"
          value={achat.franco}
          onChange={(v) => set((a) => void (a.franco = v))}
        />
        <Text
          label="RFA (remise de fin d'année)"
          value={achat.rfa}
          onChange={(v) => set((a) => void (a.rfa = v))}
        />
        <Select
          label="RFA payée par"
          value={achat.rfa_versee_par ?? ""}
          onChange={(v) => set((a) => void (a.rfa_versee_par = v))}
          options={["Groupement", "En direct"]}
        />
        <Select
          label="Fréquence de commande"
          value={achat.frequence_commande}
          onChange={(v) => set((a) => void (a.frequence_commande = v))}
          options={[
            "Hebdomadaire",
            "Bimensuelle",
            "Mensuelle",
            "Trimestrielle",
            "Semestrielle",
            "Annuelle",
            "À la demande",
          ]}
          allowFree
        />
      </Grid>

      <div className="mt-4">
        <p className="mb-1 text-sm font-medium">Remises additionnelles par marché / gamme</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Exemple : remise de base 25 % sur la marque, puis « Solaire » à 35 % si le marché est
          ouvert.
        </p>
        <div className="space-y-2">
          {(achat.remises_marches ?? []).map((r, j) => (
            <div key={r.id} className="rounded-md border border-border p-2">
              <Grid>
                <Text
                  label="Marché / gamme concernée"
                  value={r.marche}
                  onChange={(v) => set((a) => void (a.remises_marches[j].marche = v))}
                />
                <Text
                  label="Remise"
                  suffix="%"
                  value={r.taux}
                  onChange={(v) => set((a) => void (a.remises_marches[j].taux = v))}
                />
                <Text
                  label="Condition (engagement, période…)"
                  value={r.condition}
                  onChange={(v) => set((a) => void (a.remises_marches[j].condition = v))}
                />
              </Grid>
              <div className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => set((a) => void a.remises_marches.splice(j, 1))}
                >
                  Retirer cette remise
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            set((a) => {
              if (!a.remises_marches) a.remises_marches = [];
              a.remises_marches.push({ id: uid(), marche: "", taux: "", condition: "" });
            })
          }
        >
          Ajouter une remise par marché
        </Button>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">Gestion des périmés</p>
        <CheckGroup
          options={[
            "Avoir",
            "Abattement",
            "Avoir en UG",
            "Avoir sur application",
            "Pas de reprise",
          ]}
          values={achat.perimes_modalites ?? []}
          onToggle={(v) =>
            set((a) => {
              const cur = a.perimes_modalites ?? [];
              a.perimes_modalites = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
            })
          }
          columns={3}
        />
        <div className="mt-3">
          <Grid>
            {(achat.perimes_modalites ?? []).includes("Abattement") ? (
              <Text
                label="Abattement appliqué"
                suffix="%"
                value={achat.perimes_abattement_pct ?? ""}
                onChange={(v) => set((a) => void (a.perimes_abattement_pct = v))}
              />
            ) : null}
            <Text
              label="Montant en attente de paiement (périmés)"
              suffix="€"
              value={achat.perimes_montant_attente ?? ""}
              onChange={(v) => set((a) => void (a.perimes_montant_attente = v))}
            />
          </Grid>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">Commandes passées</p>
        <div className="space-y-2">
          {(achat.commandes ?? []).map((cmd, j) => (
            <div key={cmd.id} className="rounded-md border border-border p-2">
              <Grid>
                <Text
                  label="Date de commande"
                  type="date"
                  value={cmd.date}
                  onChange={(v) => set((a) => void (a.commandes[j].date = v))}
                />
                <Text
                  label="Montant"
                  suffix="€"
                  value={cmd.montant}
                  onChange={(v) => set((a) => void (a.commandes[j].montant = v))}
                />
                <Text
                  label="Descriptif"
                  value={cmd.descriptif}
                  onChange={(v) => set((a) => void (a.commandes[j].descriptif = v))}
                />
              </Grid>
              <div className="text-right">
                <Button variant="ghost" onClick={() => set((a) => void a.commandes.splice(j, 1))}>
                  Retirer cette commande
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            set((a) => void a.commandes.push({ id: uid(), date: "", montant: "", descriptif: "" }))
          }
        >
          Ajouter une commande
        </Button>
      </div>

      <div className="mt-3">
        <Area
          label="Commentaire achat"
          rows={2}
          value={achat.commentaire}
          onChange={(v) => set((a) => void (a.commentaire = v))}
        />
      </div>
    </div>
  );
}
