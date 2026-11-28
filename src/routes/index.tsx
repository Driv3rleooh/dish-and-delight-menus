import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, ClipboardList, QrCode, UserRound, Sparkles, Plus, Layers3, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type DashboardStats = { projects: number; cards: number };

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ projects: 0, cards: 0 });
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("bem-vindo(a)");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [{ count: projects }, { count: cards }, { data: auth }] = await Promise.all([
        supabase.from("menu_projects").select("id", { count: "exact", head: true }),
        supabase.from("web_cards").select("id", { count: "exact", head: true }),
        supabase.auth.getUser(),
      ]);
      if (!active) return;
      setStats({ projects: projects ?? 0, cards: cards ?? 0 });
      const emailName = auth.user?.email?.split("@")[0]?.split(/[._-]/)[0];
      if (emailName) setFirstName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#f6f9fd] px-4 py-7 text-slate-800 sm:px-7 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#101d35] px-6 py-8 text-white shadow-[0_24px_70px_-35px_rgba(30,64,175,.55)] sm:px-10 sm:py-11">
          <div className="absolute -right-16 -top-32 -z-10 size-80 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="absolute -bottom-40 right-1/4 -z-10 size-96 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute right-8 top-8 hidden h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] md:flex">
            <img src="/wave-logo.svg" alt="" className="h-28 w-28 object-contain drop-shadow-[0_0_24px_rgba(73,190,226,.3)]" />
          </div>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-100">
              <Sparkles className="size-3.5" /> SEU PAINEL WAVE
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Olá, {firstName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Tudo o que você precisa para criar experiências digitais incríveis para seus clientes, em um só lugar.</p>
            <Link to="/projects" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#20cbb6] via-[#2998d8] to-[#6554e8] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:brightness-110">
              <Plus className="size-4" /> Criar novo projeto <ArrowUpRight className="ml-1 size-4" />
            </Link>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)]">
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Projetos cadastrados</span><span className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700"><BriefcaseBusiness className="size-5" /></span></div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{loading ? "—" : stats.projects}</p>
            <p className="mt-1 text-xs text-slate-400">Clientes e projetos na plataforma</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)]">
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Web Cartões</span><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><QrCode className="size-5" /></span></div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{loading ? "—" : stats.cards}</p>
            <p className="mt-1 text-xs text-slate-400">Cartões digitais cadastrados</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)]">
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Central de trabalho</span><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Activity className="size-5" /></span></div>
            <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">Wave Workspace</p>
            <p className="mt-1 text-xs text-slate-400">Suas ferramentas em um único ambiente</p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#2998c9]">Acesse suas ferramentas</p><h2 className="mt-1 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">O que vamos criar hoje?</h2></div>
            <span className="text-sm text-slate-400">Escolha uma funcionalidade para começar</span>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Link to="/projects" className="group relative overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_-32px_rgba(15,23,42,.4)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_22px_50px_-30px_rgba(14,165,233,.3)] sm:p-8">
              <div className="absolute -right-12 -top-12 size-48 rounded-full bg-cyan-100/70 blur-2xl transition group-hover:bg-cyan-200/80" />
              <div className="relative flex items-start justify-between gap-4"><div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-3.5 text-white shadow-lg shadow-cyan-500/20"><ClipboardList className="size-7" /></div><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">Criação · Edição · Consulta</span></div>
              <div className="relative mt-7"><h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Projetos e Cardápios</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Cadastre clientes, crie cardápios digitais, personalize conteúdos e acompanhe seus projetos.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Acessar projetos <ArrowUpRight className="size-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" /></span></div>
            </Link>
            <Link to="/web-cards" className="group relative overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_-32px_rgba(15,23,42,.4)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_22px_50px_-30px_rgba(124,58,237,.28)] sm:p-8">
              <div className="absolute -right-12 -top-12 size-48 rounded-full bg-violet-100/70 blur-2xl transition group-hover:bg-violet-200/80" />
              <div className="relative flex items-start justify-between gap-4"><div className="rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 p-3.5 text-white shadow-lg shadow-violet-500/20"><QrCode className="size-7" /></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">QR Code · NFC · Link</span></div>
              <div className="relative mt-7"><h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Web Cartões</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Crie páginas digitais para estabelecimentos, personalize cada cartão e compartilhe por QR Code ou NFC.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-violet-700">Acessar Web Cartões <ArrowUpRight className="size-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" /></span></div>
            </Link>
          </div>
        </section>

        <section className="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-gradient-to-br from-cyan-100 to-violet-100 p-3 text-blue-700"><UserRound className="size-5" /></div><div><h3 className="font-bold text-slate-900">Sua conta Wave</h3><p className="mt-0.5 text-sm text-slate-500">Mantenha seus dados e informações de acesso atualizados.</p></div></div>
          <Link to="/profile" className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:self-auto">Meu perfil <ArrowUpRight className="size-4" /></Link>
        </section>
        <footer className="mt-8 flex items-center justify-between border-t border-slate-200/80 pt-5 text-xs text-slate-400"><span>Wave · Seu espaço de criação digital</span><span className="inline-flex items-center gap-1.5"><Layers3 className="size-3.5" /> Tudo conectado em um só lugar</span></footer>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [
    { title: "Wave — painel principal" },
    { name: "description", content: "Acesse suas ferramentas, projetos e Web Cartões da Wave." },
  ] }),
  component: DashboardPage,
});
