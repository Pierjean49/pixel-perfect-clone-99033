import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

/**
 * Frein d'usage des fonctions IA, sans compte utilisateur.
 *
 * Limite : la mémoire d'un serveur « serverless » n'est ni partagée entre instances
 * ni conservée longtemps. Ce frein arrête un abus simple (boucle, double-clic, script
 * naïf), pas un attaquant déterminé. Pour une vraie protection, ajouter une règle de
 * limitation de débit côté hébergeur (Cloudflare) ou des comptes utilisateurs.
 */
const FENETRE_MS = 10 * 60 * 1000;
const MAX_PAR_ADRESSE = 12; // appels par adresse IP et par fenêtre
const MAX_GLOBAL = 150; // appels toutes adresses confondues, par fenêtre et par instance

const appels = new Map<string, number[]>();
let global: number[] = [];

export function verifierQuotaIA() {
  const maintenant = Date.now();
  const depuis = maintenant - FENETRE_MS;
  const ip =
    getRequestHeader("cf-connecting-ip") ?? getRequestIP({ xForwardedFor: true }) ?? "inconnue";

  global = global.filter((t) => t > depuis);
  const recents = (appels.get(ip) ?? []).filter((t) => t > depuis);

  if (recents.length >= MAX_PAR_ADRESSE || global.length >= MAX_GLOBAL) {
    appels.set(ip, recents);
    throw new Error("Trop de demandes. Réessaie dans quelques minutes.");
  }

  recents.push(maintenant);
  global.push(maintenant);
  appels.set(ip, recents);

  // Ménage occasionnel pour ne pas garder d'adresses inactives en mémoire.
  if (appels.size > 500) {
    for (const [cle, liste] of appels) {
      if (!liste.some((t) => t > depuis)) appels.delete(cle);
    }
  }
}
