import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { FormProvider } from "../lib/store";

const ONGLETS = [
  { to: "/", label: "Accueil" },
  { to: "/formulaire", label: "Formulaire" },
  { to: "/prompts", label: "Prompts" },
  { to: "/guide", label: "Guide" },
  { to: "/securisation", label: "Sécurisation" },
  { to: "/glossaire", label: "Glossaire" },
];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page ne s'est pas chargée
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un incident est survenu. Tu peux réessayer ou revenir à l'accueil ; ton formulaire reste
          enregistré dans ce navigateur.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Module Formation — Agent Trade & Gammes" },
      {
        name: "description",
        content:
          "Générateur de prompts et guide pédagogique pour construire l'Agent Trade & Gammes de votre officine.",
      },
      { name: "author", content: "MaFormationOfficinale.com" },
      { property: "og:title", content: "Module Formation — Agent Trade & Gammes" },
      {
        property: "og:description",
        content:
          "Générateur de prompts et guide pédagogique pour construire l'Agent Trade & Gammes de votre officine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  );
}

function Navigation() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-[var(--color-background)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg font-display text-sm font-bold"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
          >
            TG
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold">Agent Trade &amp; Gammes</span>
            <span className="block text-xs text-muted-foreground">MaFormationOfficinale.com</span>
          </span>
        </Link>
        <nav className="-mx-1 flex flex-wrap gap-1 overflow-x-auto">
          {ONGLETS.map((o) => (
            <Link
              key={o.to}
              to={o.to}
              activeOptions={{ exact: o.to === "/" }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{
                className:
                  "rounded-lg px-3 py-1.5 text-sm font-semibold bg-primary-soft text-primary transition",
              }}
            >
              {o.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <FormProvider>
        <div className="min-h-screen pt-[76px] lg:pt-[68px]">
          <Navigation />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
            Module Formation — Agent Trade &amp; Gammes · MaFormationOfficinale.com · Aucune donnée
            n'est envoyée à un serveur : tout reste dans ce navigateur.
          </footer>
        </div>
      </FormProvider>
    </QueryClientProvider>
  );
}
