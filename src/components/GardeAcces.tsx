import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { PAGES_PUBLIQUES, verifierAcces } from "@/lib/acces";

type Session = { email: string; admin: boolean } | null;
const Ctx = createContext<Session>(null);
export const useSessionModule = () => useContext(Ctx);

/** Exige un compte connecté ET un accès actif, revérifié à chaque changement de page. */
export function GardeAcces({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const publique = PAGES_PUBLIQUES.includes(pathname);
  const [session, setSession] = useState<Session>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (publique) return;
    let annule = false;
    setPret(false);
    void verifierAcces().then((e) => {
      if (annule) return;
      if (e.statut === "ok") {
        setSession({ email: e.email, admin: e.admin });
        setPret(true);
      } else {
        setSession(null);
        void navigate({
          to: "/connexion",
          search: e.statut === "termine" ? { fin: 1 } : {},
          replace: true,
        });
      }
    });
    return () => void (annule = true);
  }, [pathname, publique, navigate]);

  if (publique) return <>{children}</>;
  if (!pret)
    return (
      <p className="py-24 text-center text-sm text-muted-foreground">Vérification de ton accès…</p>
    );
  return <Ctx.Provider value={session}>{children}</Ctx.Provider>;
}
