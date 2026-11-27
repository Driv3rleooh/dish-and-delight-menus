import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Save, UserRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { profileQuery } from "@/lib/profile-query";
import { updateProfile } from "@/lib/profile.functions";
import { profileName } from "@/lib/auth-validation";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [
    { title: "Meu perfil — Wave" },
    { name: "description", content: "Gerencie seu nome e sua conta no Wave." },
    { property: "og:title", content: "Meu perfil — Wave" },
    { property: "og:description", content: "Sua conta pessoal no Wave." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  component: Profile,
});

function Profile() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const [name, setName] = useState(profile.name);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(updateProfile);
  const queryClient = useQueryClient();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = profileName.safeParse(name);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Informe seu nome."); return; }
    setBusy(true);
    try {
      await save({ data: { name: parsed.data } });
      await queryClient.invalidateQueries({ queryKey: profileQuery.queryKey });
      toast.success("Nome salvo.");
    } catch { toast.error("Não foi possível salvar seu nome. Tente novamente."); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-2xl px-6 py-12">
    <UserRound className="mb-5 size-9 text-primary" />
    <h1 className="break-words font-display text-3xl">{profile.name ? `Olá, ${profile.name}` : "Meu perfil"}</h1>
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div><label htmlFor="profile-name" className="mb-2 block text-sm font-semibold">Seu nome</label><input id="profile-name" autoComplete="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} className="h-11 w-full rounded-md border bg-card px-3 outline-none focus:ring-2 focus:ring-ring" /></div>
      <div><label htmlFor="profile-email" className="mb-2 block text-sm font-semibold">E-mail</label><input id="profile-email" readOnly value={profile.email} className="h-11 w-full rounded-md border bg-muted px-3 text-muted-foreground" /></div>
      <Button type="submit" disabled={busy}><Save />{busy ? "Salvando…" : "Salvar nome"}</Button>
    </form>
    <div className="mt-10 border-t pt-6"><Button asChild variant="outline"><Link to="/">Ir aos cardápios <ArrowRight /></Link></Button></div>
  </main>;
}