import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { signupSchema } from "@/lib/auth-validation";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Entrar ou cadastrar — Wave" },
    { name: "description", content: "Crie sua conta com nome e e-mail ou entre com Google no Wave." },
    { property: "og:title", content: "Entrar ou cadastrar — Wave" },
    { property: "og:description", content: "Acesse seu perfil pessoal no Wave." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user) void navigate({ to: "/profile", replace: true }); }, [user, navigate]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (mode === "signup") {
      const parsed = signupSchema.safeParse({ name, email, password });
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Confira os dados."); return; }
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: failure } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/profile` } });
        if (failure) { setError(failure.code === "email_address_invalid" ? "Informe um e-mail válido." : failure.code === "user_already_exists" ? "Já existe uma conta com esse e-mail. Entre na sua conta." : "Não foi possível cadastrar. Confira os dados e tente novamente."); return; }
        if (!data.session) setConfirmation(true);
        else await navigate({ to: "/profile", replace: true });
      } else {
        const { error: failure } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (failure) { setError(failure.code === "email_not_confirmed" ? "Confirme seu e-mail antes de entrar." : failure.code === "invalid_credentials" ? "E-mail ou senha incorretos." : "Não foi possível entrar. Tente novamente."); return; }
        await navigate({ to: "/profile", replace: true });
      }
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  };
  const google = async () => {
    setError(""); setBusy(true);
    try {
      const { error: failure } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth` } });
      if (failure) setError("O acesso pelo Google não está disponível. Entre com e-mail ou tente novamente mais tarde.");
    } catch { setError("Não foi possível conectar ao Google."); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-md px-6 py-10 sm:py-14">
    <h1 className="font-display text-3xl">Sua conta no Wave</h1>
    {confirmation ? <div className="mt-8 space-y-4"><Mail className="size-9 text-primary" /><h2 className="text-xl font-semibold">Confirme seu e-mail</h2><p className="break-words text-muted-foreground">Enviamos uma confirmação para {email}. Abra o link recebido para acessar seu perfil.</p><Button variant="outline" onClick={() => { setConfirmation(false); setMode("login"); }}>Voltar para entrar</Button></div> : <>
      <Tabs value={mode} onValueChange={value => { setMode(value); setError(""); }} className="mt-7"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Cadastrar</TabsTrigger></TabsList></Tabs>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && <div><label htmlFor="name" className="mb-2 block text-sm font-semibold">Seu nome</label><input id="name" autoComplete="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} className="h-11 w-full rounded-md border bg-card px-3 outline-none focus:ring-2 focus:ring-ring" /></div>}
        <div><label htmlFor="email" className="mb-2 block text-sm font-semibold">E-mail</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-11 w-full rounded-md border bg-card px-3 outline-none focus:ring-2 focus:ring-ring" /></div>
        <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">Senha</label><div className="relative"><input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : 1} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Pelo menos 8 caracteres" : ""} className="h-11 w-full rounded-md border bg-card pl-3 pr-12 outline-none focus:ring-2 focus:ring-ring" /><Button type="button" variant="ghost" size="icon" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1">{showPassword ? <EyeOff /> : <Eye />}</Button></div></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="h-11 w-full">{busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}<ArrowRight /></Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
      <Button variant="outline" disabled={busy} onClick={google} className="h-11 w-full"><span aria-hidden="true" className="font-bold">G</span>Continuar com Google</Button>
    </>}
  </main>;
}