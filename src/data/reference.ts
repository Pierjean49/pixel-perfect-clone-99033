export type PoleRef = { nom: string; couleur: string };

export const POLES: PoleRef[] = [
  { nom: "Dermo-cosmétique", couleur: "#C25A7C" },
  { nom: "Cosmétique & beauté", couleur: "#A24E8F" },
  { nom: "Compléments alimentaires", couleur: "#3FA34D" },
  { nom: "Bébé & maman", couleur: "#4FA8C7" },
  { nom: "Hygiène & soins du corps", couleur: "#5B8DEF" },
  { nom: "Capillaire", couleur: "#8B5E3C" },
  { nom: "Solaire", couleur: "#E8A33D" },
  { nom: "Aromathérapie & phytothérapie", couleur: "#6FA84B" },
  { nom: "OTC / médication familiale", couleur: "#0E7A5F" },
  { nom: "Nutrition & minceur", couleur: "#D2694A" },
  { nom: "Orthopédie & contention", couleur: "#6B7A8F" },
  { nom: "Maintien à domicile", couleur: "#8A97A6" },
  { nom: "Vétérinaire", couleur: "#7E6BAF" },
  { nom: "Buccodentaire", couleur: "#3BA9A0" },
  { nom: "Premiers soins", couleur: "#C0392B" },
  { nom: "Diététique & nutrition médicale", couleur: "#B08A3E" },
  { nom: "Incontinence", couleur: "#9AA7B0" },
  { nom: "Sexualité & intimité", couleur: "#B0567E" },
];

export const SOUS_POLES_SUGGERES: Record<string, string[]> = {
  "Dermo-cosmétique": [
    "Peaux sèches & atopiques",
    "Peaux sensibles/réactives",
    "Imperfections/acné",
    "Anti-âge",
    "Pigmentation/taches",
    "Cicatrisation/réparation",
    "Solaire",
    "Rosacée/rougeurs",
  ],
};

export const COULEURS_RESERVE = [
  "#7B9E89",
  "#9C6B4F",
  "#5E7CA8",
  "#B3746B",
  "#7F8C5A",
  "#A67BA0",
];

export const MARQUES_PAR_SECTEUR: Record<string, string[]> = {
  "Dermo-cosmétique": [
    "Avène", "La Roche-Posay", "Bioderma", "Uriage", "Ducray", "A-Derma", "SVR", "Noreva",
    "CeraVe", "Eucerin", "Lierac", "Dexeryl", "Topicrem",
    "ACM", "Codexial", "Cetaphil", "ISDIN", "SkinCeuticals", "Roger Cavaillès", "Embryolisse", "Même",
  ],
  "Cosmétique & beauté": [
    "Nuxe", "Caudalie", "Embryolisse", "Sanoflore", "Melvita", "Weleda", "Vichy",
    "Roger & Gallet", "Payot", "Esthederm", "Lierac", "Talika", "Eye Care",
    "Bioderma Photoderm Nude",
    "Filorga", "Garancia", "La Rosée", "Patyka", "Novexpert", "Darphin", "Florame",
    "Cattier", "Jonzac", "Phyt's", "Respire", "Krème", "Clémence & Vivien",
    "Laboratoires de Biarritz", "Endro", "Avril", "Centifolia", "La Canopée", "Oden",
    "Erborian", "René Furterer", "LSL", "Klorane",
  ],
  "Compléments alimentaires": [
    // Priorité 1 — cœur de marché
    "Pileje", "Nutergia", "Arkopharma", "Solgar", "Forté Pharma", "Granions", "NHCO Nutrition",
    "Aragan", "Santé Verte", "Herbesan / Superdiet", "Naturactive", "Nutréov", "Alvityl",
    // Priorité 2 — significatif
    "Aboca", "Biocodex", "Ineldea", "Les 3 Chênes", "Nat & Form", "Vitavea", "Santarome",
    "Synergia", "Bion 3", "Juvamine", "Eafit", "Eric Favre", "Santis", "Fleurance Nature",
    // Plus spécialisé
    "Densmore", "Effinov", "Le Stum", "Dayang", "Vitall+", "Laboratoires Yves Ponroy",
    "Ysonut", "Bionutrics", "Dynveo", "Fenioux", "SID Nutrition", "Nutri&Co", "Novoma",
    "Hydratis", "Copmed", "Lero", "Minolvie", "Epycure", "Pharmascience",
  ],

  "Bébé & maman": [
    // Soin bébé
    "Mustela", "Biolane", "Gilbert", "Klorane Bébé", "Weleda Bébé", "Bepanthen", "Gifrer",
    "Alphanova Bébé", "Cattier Bébé", "Pranarôm Bébé",
    // Nutrition infantile
    "Babybio", "Gallia", "Guigoz", "Novalac", "Picot", "Modilac", "Physiolac", "Nutriben",
    "Hipp", "Premibio", "Good Goût", "Popote",
    // Allaitement
    "Medela", "Lansinoh", "Elvie", "Haakaa",
    // Biberonnerie & puériculture
    "Dodie", "MAM Baby", "Philips Avent", "Béaba", "Tigex", "Suavinex", "Nuk", "Luc et Léa",
    "Tommee Tippee",
  ],
  "Hygiène & soins du corps": [
    "Saforelle", "Rogé Cavaillès", "Cattier", "Dermacide", "Sanex", "Aderma", "Cetaphil",
    "Neutrogena", "Le Petit Marseillais Pharma", "Puressentiel Hygiène",
    "Hydralin", "Saugella",
  ],
  Capillaire: [
    "Klorane", "Phyto", "Ducray", "Vichy Dercos", "René Furterer", "Kérastase", "Nioxin",
    "Luxéol", "Forcapil", "Anaphase", "Neoptide", "Bailleul", "Alopexy", "Minoxidil",
  ],
  Solaire: [
    "Avène Solaire", "La Roche-Posay Anthelios", "Bioderma Photoderm", "Uriage Bariésun",
    "Nuxe Sun", "Vichy Capital Soleil", "Eucerin Sun", "Daylong", "SVR Sun Secure",
    "Institut Esthederm",
  ],
  "Aromathérapie & phytothérapie": [
    "Puressentiel", "Pranarôm", "Naturactive", "Phytosun Arôms", "Herbalgem", "Ladrôme",
    "Elusanes", "Arkogélules", "Santarome", "Weleda", "Boiron", "Lehning", "Rocal",
  ],
  "OTC / médication familiale": [
    "Opella (Doliprane, Maalox, Dulcolax, Toplexil, Mucosolvan, Magne B6)",
    "UPSA (Dafalgan, Efferalgan, Fervex, Aspirine UPSA, Mucomyst)",
    "Reckitt (Nurofen, Gaviscon, Strepsils)",
    "Haleon (Advil, Rhinadvil, Voltarenactigo, Nicotinell)",
    "Kenvue (Imodium, Microlax, Actifed, Nicorette, Biafine, Hexomédine)",
    "Teva Santé (Spasfon, Vogalib)",
    "Mayoly (Smecta, Meteoxane)",
    "Ipsen (Forlax)",
    "Urgo Healthcare (Humex, Humer, Alvityl)",
    "Pierre Fabre (Drill, Eludril, Nicopass)",
    "Recordati (Hexaspray, Hexalyse)",
    "Perrigo / Omega Pharma (Physiomer, NiQuitin)",
    "Church & Dwight (Stérimar)",
    "Cooper (Dakin Cooper, Transipeg, Eductyl, Lansoyl, Osmosoft, Clarix)",
    "Bayer (Rennie, Aspirine Bayer)",
    "Biocodex (Ultra-Levure)",
    "Boiron (Oscillococcinum, Arnigel, Camilia, Coryzalia, Homéovox, Gastrocynésine)",
    "Viatris (Bétadine)",
    "Zambon (Fluimucil)",
    "Innotech International (Exomuc)",
  ],

  "Nutrition & minceur": [
    "XLS Medical", "Forté Pharma Turbodraine", "Anaca3", "Alli", "Milical", "Insudiet",
    "Protifast", "Kot", "Gerlinéa", "Modifast", "Nutrisanté", "Ergysport", "Overstim.s",
    "Isostar", "Punch Power",
  ],
  "Orthopédie & contention": [
    "Thuasne", "Sigvaris", "Gibaud", "Donjoy", "Epitact", "Radiante", "Innothera Varisma",
    "BSN Medical", "Bauerfeind", "Velpeau", "Actimove", "Orliman",
  ],
  "Maintien à domicile": [
    "Invacare", "Drive DeVilbiss", "Herdegen", "Vermeiren", "Winncare", "Sofamed",
    "Dupont Médical", "Hartmann", "Tena", "Hartmann Molicare", "Abena",
  ],
  Vétérinaire: [
    "Frontline", "Advantix", "Seresto", "Vectra 3D", "Milbemax", "Drontal", "Virbac",
    "Royal Canin", "Hill's", "Purina Pro Plan", "Clément Thékan", "Biocanina", "Naturlys",
  ],
  Buccodentaire: [
    "Elmex", "Sensodyne", "Parodontax", "Fluocaril", "Meridol", "Gum", "Inava", "Curaprox",
    "Arthrodont", "Eludril", "Hextril", "Alodont", "Corega", "Fixodent", "Steradent",
  ],
  "Premiers soins": [
    "Hansaplast", "Urgo", "Mercurochrome", "Bétadine", "Biseptine", "Dakin", "Steripan",
    "Compeed", "Nexcare", "Cicatridine", "Cicabio", "Cicalfate",
  ],
};

export const GROUPEMENTS = [
  "Apothical", "Aprium", "BePharma", "Elsie Santé", "Forum Santé", "Giphar", "Giropharm",
  "Leadersanté", "Mediprix", "Pharmaccord", "Pharmabest", "Pharmactiv", "Pharmavie", "Synaps",
  "Unipharm", "Univers Pharmacie", "Wellpharma", "Aucun", "Autre",
];

export const GROSSISTES = ["CERP", "OCP", "Alliance Healthcare", "Phoenix", "Autre"];

export const LGOS = ["LGPI (Pharmagest)", "Winpharma", "Smart Rx", "Pharmaland", "Alliadis/Winpharma", "Autre"];

export const ROLES_EQUIPE = [
  "Titulaire", "Pharmacien adjoint", "Préparateur", "Étudiant en pharmacie",
  "Apprenti préparateur", "Conseiller/ère dermo-cosmétique", "Esthéticienne", "Rayonniste",
  "Secrétaire/administratif", "Apprenti", "Stagiaire",
];

export const RESPONSABILITES_TRADE = [
  "Aucune", "Référent gamme", "Responsable de pôle", "Acheteur/négociateur",
  "Responsable merchandising", "Responsable animation", "Responsable formation",
];

export const AXES_DIFFERENCIATION = [
  "dermatologie médicale / peaux à problèmes", "aromathérapie & phytothérapie",
  "nutrition et micronutrition", "sport et nutrition sportive", "bébé et jeune parent",
  "orthopédie et contention", "maintien à domicile", "vétérinaire", "beauté et maquillage",
  "naturalité, bio et clean beauty", "dermo-capillaire", "homéopathie", "matériel médical",
  "oncologie et soins de support",
];

export const SERVICES_PROPOSES = [
  "espace conseil isolé", "cabine de soin ou d'esthétique", "diagnostic de peau instrumental",
  "ateliers et conférences patients", "click & collect", "site e-commerce",
  "livraison à domicile", "borne de commande", "carte de fidélité", "bilans de micronutrition",
];

export const STATUTS_GAMME = [
  "Gamme pilier", "Gamme de complément", "Gamme en test", "Gamme à arbitrer", "Gamme sortante",
];

export const POSITIONNEMENTS_GAMME = ["Premium", "Milieu de gamme", "Accessible"];

export const EMPLACEMENTS = [
  "Vitrine", "Comptoir", "Tête de gondole", "Linéaire principal", "Linéaire secondaire",
  "Réserve / sur demande",
];

export const TYPES_ACCORD = [
  "Contrat annuel", "Accord trimestriel", "Opération ponctuelle", "Accord groupement",
  "Accord grossiste", "Référencement centrale",
];

export const CONTREPARTIES = [
  "linéaire minimum garanti", "tête de gondole", "vitrine", "nombre de références minimum",
  "animation en officine", "formation de l'équipe", "mise en avant comptoir",
  "relais réseaux sociaux", "exclusivité de secteur",
];

export const INDICATEURS = [
  "CA par gamme", "marge par gamme", "rotation / couverture de stock", "panier moyen para",
  "nombre d'unités par vente", "taux de vente associée",
  "taux de vente complémentaire au comptoir", "CA par collaborateur", "CA au mètre linéaire",
  "taux de rupture", "démarque", "part des gammes piliers dans le CA", "progression vs N-1",
  "atteinte des paliers trade",
];

export const SAISONNALITE_DEFAUT: { mois: string; poles: string }[] = [
  { mois: "Janvier", poles: "détox & minceur" },
  { mois: "Février", poles: "peaux sèches" },
  { mois: "Mars", poles: "allergies & minceur" },
  { mois: "Avril", poles: "solaire & jambes lourdes" },
  { mois: "Mai", poles: "solaire & allergies" },
  { mois: "Juin", poles: "solaire & jambes lourdes" },
  { mois: "Juillet", poles: "solaire & insectes" },
  { mois: "Août", poles: "solaire & rentrée" },
  { mois: "Septembre", poles: "rentrée & capillaire & fatigue" },
  { mois: "Octobre", poles: "immunité & capillaire" },
  { mois: "Novembre", poles: "immunité & minceur" },
  { mois: "Décembre", poles: "coffrets & mains sèches" },
];

export const TYPES_ANIMATION = [
  "animation labo en officine", "offre du mois", "vitrine thématique", "atelier client",
  "diagnostic de peau", "échantillonnage", "opération réseaux sociaux",
  "SMS / newsletter client", "carte de fidélité", "vente flash",
];

export const PLV_DISPONIBLES = [
  "totem", "chevalet", "stop-rayon", "affiche vitrine", "écran dynamique",
  "présentoir de comptoir",
];

export const CRITERES_QUALITATIFS = [
  "qualité du conseil", "tenue du linéaire", "respect des contreparties trade",
  "formation suivie", "esprit d'équipe", "ponctualité de la commande",
];

export const RECOMPENSES_CHALLENGE = [
  "bon d'achat", "journée de repos", "produits", "repas d'équipe", "formation", "matériel",
];

export type ExtensionRef = { id: string; cle: string; titre: string; texte: string };

export const EXTENSIONS: ExtensionRef[] = [
  {
    id: "E1",
    cle: "ia_trade",
    titre: "E1 — IA Trade (assistant conversationnel)",
    texte:
      "Ajoute à l'agent de la {{nom_pharmacie}} un assistant accessible depuis toutes les pages. Il répond en français, à partir des seules données de l'agent, à des questions comme « quelles gammes sont en décrochage ce trimestre », « où en suis-je sur le plan {{labo}} », « quelle gamme mettre en vitrine en mars ». Il cite toujours les chiffres sur lesquels il s'appuie et la période concernée. Il refuse explicitement toute question médicale, de posologie ou de conseil patient, et renvoie vers le pharmacien. Il propose des argumentaires de vente et des textes de PLV, jamais des allégations santé non autorisées.",
  },
  {
    id: "E2",
    cle: "prevision_commande",
    titre: "E2 — Prévision de commande et réassort",
    texte:
      "Ajoute à l'agent de la {{nom_pharmacie}} le calcul, pour chaque gamme, de la couverture de stock à partir des ventes moyennes et du stock saisi. Alerte sur les risques de rupture avant une animation ou une période saisonnière forte, et propose une commande chiffrée par laboratoire, calibrée pour atteindre le prochain palier trade quand c'est pertinent. Toujours une proposition, jamais une commande automatique.",
  },
  {
    id: "E3",
    cle: "chattrade",
    titre: "E3 — ChatTrade",
    texte:
      "Ajoute à l'agent de la {{nom_pharmacie}} un fil de discussion interne par pôle et par gamme, plus des messages directs. Il sert à signaler une rupture, partager un retour client, annoncer une opération. Prévois un marquage « urgent » ; les notifications email seront activées à la sécurisation, ne les code pas maintenant.",
  },
  {
    id: "E4",
    cle: "veille_prix",
    titre: "E4 — Veille concurrentielle et prix",
    texte:
      "Ajoute à l'agent de la {{nom_pharmacie}} un relevé manuel des prix pratiqués par la concurrence locale et en ligne, par référence : historique, écart au prix de l'officine, alerte de décrochage. Affiche en permanence ces rappels : les prix des produits non remboursables sont libres (art. L.410-2 du code de commerce) ; toute entente sur les prix entre officines est interdite ; l'officine reste tenue à l'affichage des prix dans les conditions fixées par l'arrêté du 28 novembre 2014, ce que toute modification tarifaire décidée depuis cet écran doit répercuter en rayon.",
  },
  {
    id: "E5",
    cle: "fiches_conseil",
    titre: "E5 — Fiches conseil et argumentaires",
    texte:
      "Ajoute à l'agent de la {{nom_pharmacie}} une bibliothèque de fiches par gamme, consultables au comptoir sur tablette : indications, cible, arguments clés, produits associés, objections fréquentes et réponses. Recherche instantanée. Champ « rédigé par » et date de dernière mise à jour. Aucune allégation santé non autorisée, aucune donnée patient.",
  },
  {
    id: "E6",
    cle: "quiz_formation",
    titre: "E6 — Quiz et formation d'équipe",
    texte:
      "Ajoute à l'agent de la {{nom_pharmacie}} le suivi des formations laboratoires (date, gamme, participants, attestation) et des quiz d'évaluation par gamme, avec score, historique et identification des besoins de formation. Relie les résultats à la carte de chaleur de la brique 5.",
  },
  {
    id: "E7",
    cle: "pilotage_associes",
    titre: "E7 — Tableau de bord direction avancé",
    texte:
      "Ajoute à l'agent de la {{nom_pharmacie}} une version consolidée du tableau de bord pour les officines à plusieurs associés : comparaison des périodes, budget prévisionnel para, suivi de la marge par pôle, export PDF mensuel automatisable.",
  },
  {
    id: "E8",
    cle: "multi_officines",
    titre: "E8 — Mode multi-officines / groupement",
    texte:
      "Ajoute à l'agent de la {{nom_pharmacie}} la gestion de plusieurs sites dans une même instance, avec comparaison anonymisée entre officines, consolidation du CA et négociation groupée des plans trade. Cloisonnement strict des données par site : un utilisateur ne voit que son officine, sauf rôle « direction groupe ».",
  },
  {
    id: "E9",
    cle: "import_programme",
    titre: "E9 — Import automatique LGO",
    texte:
      "Si le LGO {{lgo}} le permet, mets en place le dépôt automatique de l'export dans un dossier surveillé, avec import programmé et notification du résultat. À défaut, programme un rappel mensuel « pense à importer tes ventes ».",
  },
];

export type EtapeGuide = {
  n: number;
  titre: string;
  duree: string;
  audit?: boolean;
  note?: string;
};

export const ETAPES_GUIDE: EtapeGuide[] = [
  { n: 1, titre: "Générer ton prompt de démarrage", duree: "20 min", note: "Vérifie d'abord tes prérequis budgétaires : plan Lovable payant, crédits suffisants, domaine OVH (10 à 15 € / an), Cloudflare gratuit." },
  { n: 2, titre: "Créer un nouveau projet Lovable et le nommer", duree: "15 min" },
  { n: 3, titre: "Activer Lovable Cloud (base de données + authentification, région Europe)", duree: "10 min" },
  { n: 4, titre: "Créer ton compte administrateur et te connecter", duree: "15 min" },
  { n: 5, titre: "Fenêtre « Set up emails » — fermer pour l'instant", duree: "5 min" },
  { n: 6, titre: "Fenêtre « Publish » — ne pas activer maintenant", duree: "5 min" },
  { n: 7, titre: "Ajouter le logo de la pharmacie", duree: "10 min", note: "Un prompt est du texte : dépose toi-même le fichier du logo dans le chat Lovable." },
  { n: 8, titre: "Tester le pôle Dermo et sa première gamme", duree: "20 min" },
  { n: 9, titre: "Saisir 3 mois de ventes sur 2 gammes (test uniquement)", duree: "20 min" },
  { n: 10, titre: "Tester l'import d'un fichier CSV", duree: "25 min" },
  { n: 11, titre: "Comprendre les calculs : marge, taux de marge, progression N-1, CA au mètre linéaire", duree: "20 min" },
  { n: 12, titre: "Audit du Prompt 1 — étape charnière, ne pas l'ignorer", duree: "25 min", audit: true },
  { n: 13, titre: "Prompt 2 — Plans trade et analyse", duree: "20 min" },
  { n: 14, titre: "Saisir un plan trade réel et vérifier la projection de palier", duree: "25 min" },
  { n: 15, titre: "Audit du Prompt 2", duree: "20 min", audit: true },
  { n: 16, titre: "Prompt 3 — Déploiement des autres pôles, puis audit du Prompt 3", duree: "30 min", audit: true },
  { n: 17, titre: "Prompt 4 — Équipe, responsabilités et primes, puis audit du Prompt 4 (dont contrôle des calculs de prime)", duree: "35 min", audit: true },
  { n: 18, titre: "Prompt 5 — Analyse de performance et entretiens", duree: "15 min" },
  { n: 19, titre: "Prompt 6 — Merchandising, vitrines et plan d'animation", duree: "15 min" },
  { n: 20, titre: "Prompt 7 — Import LGO et tableau de bord direction", duree: "15 min" },
  { n: 21, titre: "Prompt 8 — Ergonomie et page de garde", duree: "15 min" },
  { n: 22, titre: "Prompts d'extension (optionnels, à la carte)", duree: "variable" },
  { n: 23, titre: "Remplir toutes tes données réelles (gammes, historique de ventes, plans trade, équipe) — hors visio", duree: "3 à 6 h", note: "L'agent est complet et encore totalement ouvert : c'est le meilleur moment pour saisir les vraies données sans être bloqué par un contrôle d'accès. Prévois au minimum 12 mois d'historique. Remets la note d'information à l'équipe et, dès onze salariés, consulte le comité social et économique avant d'ouvrir l'agent." },
  { n: 24, titre: "Audit final de construction (avant sécurisation)", duree: "30 min", audit: true },
];

export const REGLES_PEDAGOGIQUES = [
  "Une brique = une demande. Découper les demandes donne un résultat beaucoup plus propre qu'un prompt fleuve.",
  "Ne jamais modifier un prompt du module avant de le coller. C'est la première cause d'écart entre participants.",
  "Après chaque audit validé : Publish, puis renomme la version dans History (« Fin Prompt 3 — Audit OK »). Exporte aussi le JSON de sauvegarde.",
  "N'enchaîne jamais sur le prompt suivant tant qu'un point bloquant subsiste : les briques s'empilent, une erreur non corrigée se propage.",
];

export const AUDIT_ECHOUE = [
  "Relance l'audit une seconde fois : l'agent corrige souvent au deuxième passage.",
  "Toujours bloqué : isole le point qui échoue et redemande-le seul, en une phrase, sans reformuler le prompt d'origine.",
  "Deux échecs sur le même point : reviens à la dernière version nommée dans History, réimporte ta sauvegarde JSON, et rejoue la brique.",
  "Toujours bloqué après restauration : transmets le rapport d'audit complet au formateur.",
  "Ne passe jamais à la brique suivante avec un point rouge : l'erreur se propagerait à toutes les briques suivantes.",
];

export const GLOSSAIRE_TRADE: { terme: string; definition: string }[] = [
  { terme: "Sell-in", definition: "Ce que l'officine achète au laboratoire. C'est la base des paliers d'un plan trade." },
  { terme: "Sell-out", definition: "Ce que l'officine vend réellement à ses clients. L'écart avec le sell-in révèle le surstock." },
  { terme: "RFA (remise de fin d'année)", definition: "Remise différée, versée après coup selon le volume d'achat atteint sur la période." },
  { terme: "UG (unités gratuites)", definition: "Produits offerts par le laboratoire, par exemple « 12+2 ». Leur valeur compte dans le gain réel de l'accord." },
  { terme: "Palier", definition: "Seuil d'achat qui déclenche un avantage supplémentaire dans un plan trade." },
  { terme: "Contrepartie", definition: "Engagement pris par l'officine en échange des avantages : linéaire, vitrine, références, animation, formation." },
  { terme: "Linéaire", definition: "Longueur de rayonnage occupée par une gamme, exprimée en mètres." },
  { terme: "Facing", definition: "Nombre de produits visibles de face sur une étagère pour une même référence." },
  { terme: "Tête de gondole (TG)", definition: "Extrémité de rayon, emplacement le plus visible et le plus disputé de l'officine." },
  { terme: "Zone chaude", definition: "Zone du magasin par laquelle passent le plus de clients." },
  { terme: "PLV", definition: "Publicité sur le lieu de vente : totem, chevalet, stop-rayon, affiche vitrine, écran, présentoir." },
  { terme: "Rotation", definition: "Vitesse à laquelle un stock se renouvelle sur une période donnée." },
  { terme: "Couverture de stock", definition: "Nombre de jours ou de mois de vente que le stock actuel permet de couvrir." },
  { terme: "Démarque", definition: "Perte de valeur du stock : casse, vol, péremption, remise exceptionnelle." },
  { terme: "Panier moyen", definition: "Chiffre d'affaires moyen par client sur une période." },
  { terme: "Vente associée", definition: "Produit complémentaire proposé au comptoir en plus de la demande initiale." },
  { terme: "UPO", definition: "Unités par ordonnance : ratio agrégé, jamais une donnée patient." },
  { terme: "Taux de transformation", definition: "Part des conseils qui aboutissent à une vente." },
  { terme: "CA au mètre linéaire", definition: "Chiffre d'affaires généré par mètre de rayonnage : le meilleur arbitre d'un arbitrage de gamme." },
  { terme: "Gamme pilier", definition: "Gamme structurante du pôle, celle qu'on ne déréférence pas." },
  { terme: "Référencement", definition: "Entrée d'une gamme dans l'assortiment de l'officine." },
  { terme: "Centrale", definition: "Structure d'achat qui négocie pour un ensemble d'officines." },
  { terme: "Groupement", definition: "Réseau d'officines partageant enseigne, achats et services." },
  { terme: "Grossiste-répartiteur", definition: "Intermédiaire logistique livrant l'officine plusieurs fois par jour." },
  { terme: "LGO", definition: "Logiciel de gestion d'officine : la source des exports de ventes." },
  { terme: "OTC", definition: "Médication familiale, produits de prescription facultative." },
  { terme: "Dermo-cosmétique", definition: "Cosmétique à visée dermatologique, cœur du CA para de la plupart des officines." },
  { terme: "Dispositif anti-cadeaux", definition: "Art. L.1453-3 et suivants du Code de la santé publique : les avantages consentis par un industriel sont interdits par principe, sauf convention déclarée ou autorisée." },
  { terme: "CCN pharmacie d'officine (IDCC 1996)", definition: "Convention collective fixant minima et coefficients ; elle n'organise pas la rémunération variable." },
];

export const GLOSSAIRE_IA: { terme: string; definition: string }[] = [
  { terme: "Prompt", definition: "Demande écrite adressée à l'IA. Ici, un texte à coller tel quel." },
  { terme: "Prompt maître", definition: "Le premier prompt, qui pose la fondation de l'agent." },
  { terme: "Brique", definition: "Un bloc fonctionnel construit en une seule demande." },
  { terme: "Itération", definition: "Un aller-retour avec l'IA pour corriger ou compléter." },
  { terme: "Audit", definition: "Prompt de vérification point par point avant de passer à la brique suivante." },
  { terme: "Dérive de spécification", definition: "L'IA s'écarte de la demande et invente. C'est ce que les audits détectent." },
  { terme: "Base de données", definition: "Endroit où l'agent range durablement les informations saisies." },
  { terme: "Table", definition: "Un tableau de la base : une ligne par gamme, par vente, par collaborateur." },
  { terme: "Authentification", definition: "Vérification de l'identité de la personne qui se connecte." },
  { terme: "Rôle", definition: "Niveau de droits : administrateur, manager, collaborateur." },
  { terme: "RLS", definition: "Restriction au niveau des lignes : chacun ne voit que les données autorisées par son rôle." },
  { terme: "MFA", definition: "Double authentification : mot de passe + code à 6 chiffres renouvelé toutes les 30 secondes." },
  { terme: "DNS", definition: "Annuaire qui relie un nom de domaine à un serveur." },
  { terme: "CNAME", definition: "Enregistrement DNS qui fait pointer une adresse vers une autre." },
  { terme: "Serveur de noms", definition: "Serveur qui fait autorité sur les enregistrements DNS d'un domaine." },
  { terme: "Proxy", definition: "Intermédiaire (Cloudflare) qui filtre le trafic avant l'application." },
  { terme: "SSL/TLS", definition: "Chiffrement des échanges entre le navigateur et le site (le cadenas)." },
  { terme: "SPF, DKIM, DMARC", definition: "Enregistrements DNS qui authentifient les emails envoyés par l'agent." },
  { terme: "RGPD", definition: "Règlement européen sur la protection des données personnelles." },
  { terme: "Hébergement en Europe", definition: "Région imposée à l'activation de Lovable Cloud : nécessaire, mais pas suffisant." },
  { terme: "Export CSV", definition: "Fichier tableur, format d'échange avec le LGO." },
  { terme: "JSON", definition: "Format du fichier de sauvegarde du formulaire de ce module." },
];

export const COUCHES_SECURITE = [
  { couche: "0. Identité du site", role: "Une adresse fixe, vérifiée, professionnelle", outil: "OVH (nom de domaine)" },
  { couche: "1. Filtrage d'accès", role: "Bloque robots et attaques avant la page de connexion", outil: "Cloudflare" },
  { couche: "2. Authentification", role: "Vérifie l'identité et le rôle", outil: "Lovable Cloud" },
  { couche: "3. Double facteur (MFA)", role: "Code à 6 chiffres renouvelé toutes les 30 secondes", outil: "Application d'authentification" },
];

export const ETAPES_SECURISATION = [
  {
    id: "S2",
    titre: "S2 · Nom de domaine OVH",
    points: [
      "Achat du domaine (extension .com, coordonnées du titulaire, protection WHOIS, renouvellement automatique).",
      "Sécurisation du compte OVH : 2FA, verrouillage du domaine, DNSSEC optionnel, email de contact à jour.",
      "Liaison depuis Lovable : Publish → Connect a domain → domaine existant.",
      "Passage du projet en visibilité publique pour que l'équipe accède à la page de connexion, et non à une demande d'accès Lovable.",
      "Lecture des statuts : Verifying, Action required, Ready, Live.",
    ],
    vigilance:
      "Deux doubles authentifications distinctes seront à activer : celle du compte OVH, qui protège l'adresse, et celle de l'agent, qui protège les données.",
  },
  {
    id: "S3",
    titre: "S3 · Cloudflare",
    points: [
      "Création du compte avec 2FA, ajout du domaine en forfait gratuit.",
      "Vérification des enregistrements DNS importés, relevé des deux serveurs de noms.",
      "Délégation depuis OVH : Serveurs DNS → Modifier, puis attente de propagation (quelques minutes à 24 h).",
      "Rebranchement de l'agent en configuration manuelle, option « derrière un proxy » cochée, création du CNAME demandé.",
      "Réglages exigés : SSL/TLS en Full (strict) · Always Use HTTPS · Bot Fight Mode · Automatic HTTPS Rewrites · redirection du www vers le domaine principal.",
    ],
    vigilance:
      "Après chaque modification, teste l'adresse depuis un autre réseau (partage de connexion du téléphone) : le cache du navigateur masque les vrais problèmes.",
  },
  {
    id: "S4",
    titre: "S4 · Emails de notification",
    points: [
      "Déclaration du sous-domaine d'envoi notify.",
      "Autorisation de la configuration DNS automatique (Cloudflare si la délégation est faite, sinon OVH).",
      "Attente du statut Active, puis republication de l'application.",
      "Tests obligatoires : mot de passe oublié · invitation d'un compte de test · déclenchement d'une alerte trade · vérification qu'un collaborateur ne reçoit que ses propres informations.",
      "Dépannage : bandeau « domaine non configuré » (terminer la configuration puis republier) · bouton « Envoyer le lien » grisé (utiliser « Réinitialiser le mot de passe ») · email en spam (normal au début) · erreur no_email_domain (délégation DNS non validée).",
    ],
  },
  {
    id: "S5",
    titre: "S5 · Double authentification (MFA)",
    points: [
      "Installation de l'application d'authentification (Google Authenticator, Authy ou Microsoft Authenticator).",
      "Activation d'abord sur le compte admin, conservation des codes de secours affichés une seule fois.",
      "Test de déconnexion/reconnexion, puis test d'un code de secours.",
      "Politique par rôle : MFA obligatoire pour admin et manager, proposée aux collaborateurs sauf décision du titulaire.",
      "Téléphone perdu : l'admin utilise « Réinitialiser le MFA » sur la ligne du collaborateur.",
    ],
    vigilance:
      "Sans codes de secours conservés ailleurs que sur le téléphone qui génère les codes, la perte du téléphone équivaut à la perte de l'accès administrateur.",
  },
];
