import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, useLocation, HeadContent, Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/hooks/use-auth";
import { AccountNav } from "@/components/AccountNav";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-7xl font-bold text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2><p className="mt-2 text-sm text-muted-foreground">A página não existe ou foi movida.</p><Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Voltar ao início</Link></div></div>;
}
function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error); const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return <div className="flex min-h-screen items-center justify-center px-4"><div className="text-center"><h1 className="text-xl font-semibold">Esta página não carregou</h1><p className="mt-2 text-sm text-muted-foreground">Tente atualizar ou voltar ao início.</p><button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground">Tentar novamente</button></div></div>;
}
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Wave — Criação de Cardápios" },
      { name: "description", content: "Crie cardápios incríveis com a Wave." },
      { name: "author", content: "Wave" },
      { property: "og:title", content: "Wave — Criação de Cardápios" },
      { property: "og:description", content: "Crie cardápios incríveis com a Wave." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@600&family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;600;700&display=swap" },
      { rel: "icon", href: "/wave-logo.svg?v=2", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell, component: RootComponent, notFoundComponent: NotFoundComponent, errorComponent: ErrorComponent,
});
function RootShell({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}
function RootComponent() {
  const { queryClient } = Route.useRouteContext(); const router = useRouter(); const location = useLocation();
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(false); const [routeLoading, setRouteLoading] = useState(true);
  useEffect(() => {
    setRouteLoading(true);
    const hideTimer = window.setTimeout(() => setRouteLoading(false), 520);
    return () => window.clearTimeout(hideTimer);
  }, [location.pathname]);
  useEffect(() => {
    let active = true;
    const refreshUser = () => { void supabase.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setReady(true); } }).catch(() => { if (active) { setUser(null); setReady(true); } }); };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (event === "SIGNED_OUT") { setUser(null); queryClient.clear(); } else refreshUser();
      void router.invalidate(); if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    refreshUser(); return () => { active = false; subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <QueryClientProvider client={queryClient}><AuthContext.Provider value={{ user, ready }}>{!location.pathname.startsWith("/c/") && <AccountNav />}<Outlet /><Toaster />{(routeLoading || !ready) && <div className="wave-route-loader" role="status" aria-label="Carregando"><img src="/wave-logo.svg" alt="" /></div>}</AuthContext.Provider></QueryClientProvider>;
}