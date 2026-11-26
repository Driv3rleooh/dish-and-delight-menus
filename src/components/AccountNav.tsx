import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, UserRound } from "lucide-react";
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
  return <nav aria-label="Conta" className="no-print flex min-h-14 items-center justify-between gap-2 border-b bg-card px-4 sm:px-6">
    <Link to="/" className="font-display text-lg">Cardápio Fácil</Link>
    <div className="flex items-center gap-1">
      {ready && (user ? <><Button asChild variant="ghost"><Link to="/profile"><UserRound /> Meu perfil</Link></Button><Button variant="ghost" size="icon" title="Sair da conta" aria-label="Sair da conta" onClick={signOut}><LogOut /></Button></> : <Button asChild variant="outline"><Link to="/auth"><LogIn /> Entrar / Cadastrar</Link></Button>)}
    </div>
  </nav>;
}