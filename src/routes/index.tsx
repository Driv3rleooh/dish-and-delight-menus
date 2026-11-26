import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    throw redirect({ to: "/projects" });
  },
  head: () => ({ meta: [
    { title: "Cardápio Fácil — projetos e cardápios" },
    { name: "description", content: "Cadastre clientes e gerencie seus projetos de cardápio." },
  ] }),
  component: () => null,
});
