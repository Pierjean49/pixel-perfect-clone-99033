import { useState } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui-kit";

const OBJET = "Ton accès au module « Agent Trade & Gammes »";

function corps(lien: string) {
  return `Bonjour,

Voici le lien du module qui prépare les prompts de ton agent de pilotage de gammes :
${lien}

Comment t'en servir :
1. Ouvre ce lien sur un ordinateur de l'officine, et reviens toujours sur le même navigateur : ta saisie y est enregistrée automatiquement, sans compte à créer.
2. Onglet Formulaire : décris ton officine, bloc par bloc. Tu peux t'arrêter et reprendre quand tu veux.
3. Onglet Prompts : copie chaque prompt dans Lovable, une brique à la fois, en suivant l'onglet Guide.

Un conseil : clique de temps en temps sur « Exporter mon formulaire (.json) ». C'est ta sauvegarde, et le moyen de reprendre sur un autre poste.

À bientôt`;
}

/**
 * Invitation d'un pharmacien : prépare un mail dans la messagerie de l'expéditeur.
 * Rien n'est envoyé ni enregistré par le module ; la personne invitée remplit sa
 * propre copie du formulaire, dans son propre navigateur.
 */
export function Invitation() {
  const [mail, setMail] = useState("");
  const valide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim());
  const lien = typeof window === "undefined" ? "" : window.location.origin;

  const ouvrirMail = () => {
    window.location.href = `mailto:${encodeURIComponent(mail.trim())}?subject=${encodeURIComponent(OBJET)}&body=${encodeURIComponent(corps(lien))}`;
  };

  const copier = async (texte: string, message: string) => {
    try {
      await navigator.clipboard.writeText(texte);
      toast.success(message);
    } catch {
      toast.error("Copie impossible : sélectionne le texte à la main.");
    }
  };

  return (
    <Card className="mt-6 p-6">
      <h2 className="font-display text-xl font-semibold">Inviter un pharmacien</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Il reçoit le lien du module et le mode d'emploi, remplit le formulaire de son côté et génère
        ses propres prompts. Chacun travaille dans son navigateur : tu ne vois pas sa saisie, il ne
        voit pas la tienne.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="block min-w-[240px] flex-1">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Adresse e-mail du pharmacien
          </span>
          <input
            className="field"
            type="email"
            value={mail}
            placeholder="prenom.nom@pharmacie.fr"
            onChange={(e) => setMail(e.target.value)}
          />
        </label>
        <Button onClick={ouvrirMail} disabled={!valide}>
          Préparer le mail d'invitation
        </Button>
        <Button
          variant="secondary"
          onClick={() => void copier(corps(lien), "Message copié : colle-le dans ton mail.")}
        >
          Copier le message
        </Button>
        <Button variant="secondary" onClick={() => void copier(lien, "Lien copié.")}>
          Copier le lien
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Le mail s'ouvre dans ta messagerie, prêt à être relu et envoyé. L'adresse saisie ici n'est
        ni enregistrée ni transmise.
      </p>
    </Card>
  );
}
