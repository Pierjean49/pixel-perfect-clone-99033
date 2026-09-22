import { SAISONNALITE_DEFAUT } from "@/data/reference";

export type Pole = {
  nom: string;
  couleur: string;
  responsable: string;
  poids: string;
  objectif_progression: string;
  priorite: string;
  sous_poles?: string[];
};

export type Collaborateur = {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  pole: string;
  sous_poles: string;
  sous_poles_geres?: string[];
  gammes_referentes: string[];
  responsabilite: string;
  heures_trade: string;
  date_entree: string;
};

export type Commande = { id: string; date: string; montant: string; descriptif: string };

export type RemiseMarche = { id: string; marche: string; taux: string; condition: string };

export type AchatGamme = {
  code_client: string;
  representant_prenom: string;
  representant_nom: string;
  representant_tel: string;
  representant_mail: string;
  dr_prenom: string;
  dr_nom: string;
  dr_tel: string;
  dr_mail: string;
  labo_tel: string;
  labo_mail: string;
  remises: string;
  remise_base: string;
  remises_marches: RemiseMarche[];
  franco: string;
  gestion_perimes: string;
  perimes_modalites: string[];
  perimes_abattement_pct: string;
  perimes_montant_attente: string;
  rfa: string;
  rfa_versee_par: string;
  delai_livraison: string;
  frequence_commande: string;
  commentaire: string;
  commandes: Commande[];
};

export const emptyAchat = (): AchatGamme => ({
  code_client: "",
  representant_prenom: "",
  representant_nom: "",
  representant_tel: "",
  representant_mail: "",
  dr_prenom: "",
  dr_nom: "",
  dr_tel: "",
  dr_mail: "",
  labo_tel: "",
  labo_mail: "",
  remises: "",
  remise_base: "",
  remises_marches: [],
  franco: "",
  gestion_perimes: "",
  perimes_modalites: [],
  perimes_abattement_pct: "",
  perimes_montant_attente: "",
  rfa: "",
  rfa_versee_par: "",
  delai_livraison: "",
  frequence_commande: "",
  commentaire: "",
  commandes: [],
});

export type Gamme = {
  id: string;
  nom: string;
  laboratoire: string;
  secteur: string;
  pole: string;
  statut: string;
  positionnement: string;
  lineaire_ml: string;
  descentes: string;
  emplacement: string;
  referent: string;
  ca_annuel: string;
  taux_marge: string;
  plan_trade: boolean;
  formation_labo: string;
  formations_par_an?: string;
  commentaire: string;
  pilote: boolean;
  achat: AchatGamme;
};


export type Palier = { seuil: string; avantage: string };

export type PlanTrade = {
  id: string;
  laboratoire: string;
  gammes: string[];
  type_accord: string;
  debut: string;
  fin: string;
  interlocuteur: string;
  objectif_achat: string;
  paliers: Palier[];
  remise_facture: string;
  rfa: string;
  ug: string;
  budget_plv: string;
  budget_formation: string;
  contreparties: string[];
  date_revue: string;
  convention: string;
  commentaire: string;
};

export type FormState = {
  identite: {
    nom_pharmacie: string;
    ville: string;
    prenom_titulaire: string;
    nom_titulaire: string;
    nb_titulaires: string;
    cotitulaires: string;
    groupement: string;
    lgo: string;
    ca_annuel: string;
    part_ca_para: string;
    surface: string;
    nb_descentes: string;
    nb_gondoles: string;
    nb_tg: string;
    nb_comptoirs_ordonnance: string;
    nb_comptoirs_para: string;
    comptoir_accueil: string;
    nb_salles_confidentialite: string;
    nb_ecrans_vente: string;
    nb_ecrans_vitrine: string;
    nb_vitrines: string;
    autres_infos: string;
  };
  poles: Pole[];
  positionnement: {
    axes: string[];
    services: string[];
    prix: string;
    typologie_clientele: string;
    force_distinctive: string;
  };
  equipe: Collaborateur[];
  gammes: Gamme[];
  plans: PlanTrade[];
  imports_plans: ImportPlan[];
  objectifs: {
    objectif_ca_annuel: string;
    objectif_marge_global: string;
    objectifs_poles: Record<string, string>;
    indicateurs: string[];
    periodicite: string;
    saisonnalite: { mois: string; poles: string }[];
  };
  primes: {
    dispositif: string;
    assiette: string;
    perimetre: string;
    periodicite: string;
    paliers: Palier[];
    plafond: string;
    part_collective: string;
    challenges: string;
    challenge_theme: string;
    challenge_duree: string;
    recompenses: string[];
    criteres: string[];
    validateur: string;
    commentaire: string;
  };
  merch: {
    emplacement_vitrines: string[];
    frequence_vitrine: string;
    nb_tg: string;
    zones_chaudes: string;
    plan_annuel: string;
    types_animation: string[];
    plv: string[];
    poseur: string;
    archivage_photos: string;
  };
  options: {
    extensions: string[];
    mode_import: string;
    nb_mois_historique: string;
  };
  suivi: {
    promptsValides: Record<string, boolean>;
    promptsForces: Record<string, boolean>;
    notes: Record<string, string>;
    guide: Record<string, boolean>;
    securisation: Record<string, boolean>;
  };
  meta: { savedAt: string | null };
};

export const emptyForm = (): FormState => ({
  identite: {
    nom_pharmacie: "",
    ville: "",
    prenom_titulaire: "",
    nom_titulaire: "",
    nb_titulaires: "",
    cotitulaires: "",
    groupement: "",
    lgo: "",
    ca_annuel: "",
    part_ca_para: "20",
    surface: "",
    nb_descentes: "",
    nb_gondoles: "",
    nb_tg: "",
    nb_comptoirs_ordonnance: "",
    nb_comptoirs_para: "",
    comptoir_accueil: "",
    nb_salles_confidentialite: "",
    nb_ecrans_vente: "",
    nb_ecrans_vitrine: "",
    nb_vitrines: "",
    autres_infos: "",
  },
  poles: [
    {
      nom: "Dermo-cosmétique",
      couleur: "#C25A7C",
      responsable: "",
      poids: "",
      objectif_progression: "",
      priorite: "1",
    },
  ],
  positionnement: { axes: [], services: [], prix: "", typologie_clientele: "", force_distinctive: "" },
  equipe: [],
  gammes: [],
  plans: [],
  objectifs: {
    objectif_ca_annuel: "",
    objectif_marge_global: "",
    objectifs_poles: {},
    indicateurs: [],
    periodicite: "mensuelle",
    saisonnalite: SAISONNALITE_DEFAUT.map((m) => ({ ...m })),
  },
  primes: {
    dispositif: "",
    assiette: "",
    perimetre: "",
    periodicite: "",
    paliers: [],
    plafond: "",
    part_collective: "50",
    challenges: "",
    challenge_theme: "",
    challenge_duree: "",
    recompenses: [],
    criteres: [],
    validateur: "",
    commentaire: "",
  },
  merch: {
    emplacement_vitrines: [],
    frequence_vitrine: "",
    nb_tg: "",
    zones_chaudes: "",
    plan_annuel: "",
    types_animation: [],
    plv: [],
    poseur: "",
    archivage_photos: "",
  },
  options: { extensions: [], mode_import: "les deux", nb_mois_historique: "24" },
  suivi: { promptsValides: {}, promptsForces: {}, notes: {}, guide: {}, securisation: {} },
  meta: { savedAt: null },
});

export const uid = () => Math.random().toString(36).slice(2, 10);
