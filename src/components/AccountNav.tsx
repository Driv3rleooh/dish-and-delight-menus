import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, LogIn, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AccountNav() {
  const { user, ready } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Não foi possível sair. Tente novamente."); return; }
    await navigate({ to: "/auth", replace: true });
  };
  return <nav aria-label="Conta" className="no-print relative z-30 flex min-h-14 items-center justify-between gap-2 border-b border-sky-200/60 bg-white/85 px-4 shadow-sm backdrop-blur-xl sm:px-6">
    <Link to="/" className="flex items-center gap-2.5" aria-label="Wave - início">
      <img src="/wave-logo.svg" alt="" className="size-9 object-contain" />
      <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-700 bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent">Wave</span>
    </Link>
    <div className="flex items-center gap-1">
      {ready && (user ? <><Button asChild variant="ghost"><Link to="/projects"><BriefcaseBusiness /> Projetos</Link></Button><Button asChild variant="ghost"><Link to="/profile"><UserRound /> Meu perfil</Link></Button><Button variant="ghost" size="icon" title="Sair da conta" aria-label="Sair da conta" onClick={signOut}><LogOut /></Button></> : <Button asChild variant="outline"><Link to="/auth"><LogIn /> Entrar / Cadastrar</Link></Button>)}
    </div>
  </nav>;
}