export function download(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(nom: string, texte: string) {
  download(`${nom}.md`, texte, "text/markdown;charset=utf-8");
}

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function downloadDoc(nom: string, titre: string, texte: string) {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${echapper(titre)}</title></head><body><h1>${echapper(titre)}</h1><pre style="font-family:Calibri,sans-serif;white-space:pre-wrap;font-size:11pt;">${echapper(texte)}</pre></body></html>`;
  download(`${nom}.doc`, html, "application/msword");
}

export function noteInformation(officine: string, titulaire: string) {
  const nom = officine || "l'officine";
  return `NOTE D'INFORMATION AUX SALARIÉS
${nom}

Objet : mise en service d'un outil interne de pilotage commercial (« Agent Trade & Gammes »).

1. Finalité
${nom} met en service un outil interne destiné exclusivement au pilotage commercial de la parapharmacie et de la médication familiale : suivi du chiffre d'affaires et de la marge par gamme et par pôle, suivi des accords laboratoires, objectifs, et le cas échéant calcul des primes prévues par l'entreprise. Aucune donnée patient, aucune donnée de santé, aucune ordonnance n'y est traitée.

2. Données enregistrées
Identité professionnelle (nom, prénom, fonction, rattachement à un pôle), responsabilités commerciales confiées, résultats commerciaux rattachés au périmètre du salarié, objectifs, formations laboratoires suivies, et éléments de calcul des primes.

3. Destinataires
L'accès est restreint par rôle. Le titulaire et les personnes habilitées à la direction accèdent à l'ensemble ; un responsable de pôle accède à son périmètre ; un collaborateur accède à ses propres résultats.

4. Durée de conservation
Les données de suivi commercial sont conservées trois ans à compter de leur enregistrement, sauf obligation légale plus longue.

5. Hébergement
Les données sont hébergées au sein de l'Union européenne. [À VÉRIFIER avant diffusion : région d'hébergement de la base de données et, si l'agent utilise un assistant d'IA, pays du fournisseur.]

6. Vos droits
Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition sur les données vous concernant. Ces droits s'exercent auprès de ${titulaire || "la direction de l'officine"}.

7. Information et consultation
Le traitement est inscrit au registre prévu par l'article 30 du RGPD. La présente note vaut information préalable de chaque salarié (art. L.1222-4 du Code du travail). Dans les entreprises d'au moins cinquante salariés, le comité social et économique est en outre informé et consulté avant la mise en service (art. L.2312-38 du Code du travail).

Fait à ______________, le ____/____/________

${titulaire || "Le titulaire"}`;
}

export function registreTraitements(officine: string, titulaire: string) {
  const nom = officine || "l'officine";
  return `FICHE DE REGISTRE DES TRAITEMENTS (art. 30 RGPD)
${nom}

Responsable du traitement : ${nom}${titulaire ? ` — ${titulaire}` : ""}
Coordonnées : ______________________________________________
Date de création de la fiche : ____/____/________     Dernière mise à jour : ____/____/________

Nom du traitement : Pilotage commercial parapharmacie et OTC (« Agent Trade & Gammes »)

Finalités :
- suivi des ventes, de la marge et des objectifs par gamme et par pôle ;
- suivi des accords laboratoires et de leurs contreparties ;
- calcul et suivi des primes et challenges internes.

Base légale : intérêt légitime de l'employeur pour le pilotage de l'activité commerciale ; exécution du contrat de travail pour la part relative à la rémunération variable.

Catégories de personnes concernées : salariés de l'officine, apprentis et stagiaires.

Catégories de données : identité professionnelle, fonction et rattachement, responsabilités commerciales, résultats commerciaux, objectifs, formations suivies, éléments de calcul des primes.
Aucune donnée de santé, aucune donnée patient.

Destinataires : titulaire(s), personnes habilitées à la direction, responsables de pôle pour leur périmètre, chaque salarié pour ses propres données. Gestionnaire de paie pour les seuls éléments de rémunération.

Sous-traitants / hébergeur : [À COMPLÉTER : nom de l'hébergeur de la base de données et de l'application, région d'hébergement ; nom du fournisseur d'IA si l'agent en utilise un].

Durée de conservation : 3 ans, sauf obligation légale plus longue.

Mesures de sécurité (ne conserver que celles réellement en place à la date de la fiche) :
[ ] authentification individuelle
[ ] restriction des accès par rôle (RLS)
[ ] double authentification pour les rôles administrateur et manager
[ ] filtrage du trafic
[ ] chiffrement des échanges (TLS)
[ ] journalisation des modifications

Transferts hors UE : [À VÉRIFIER : « aucun » seulement si l'hébergeur et l'éventuel fournisseur d'IA traitent les données dans l'Union européenne ; sinon, indiquer le pays et la garantie applicable].

Information des personnes : note d'information remise à chaque salarié avant la mise en service (art. L.1222-4 du Code du travail) ; information et consultation du comité social et économique dans les entreprises d'au moins cinquante salariés (art. L.2312-38 du Code du travail).`;
}
