import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, ClipboardList, QrCode, UserRound, Sparkles, Plus, Layers3, Activity, Home, MessageCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type DashboardStats = { projects: number; menus: number; cards: number; published: number; drafts: number };
type RecentCreation = { id: string; name: string; kind: "Projeto" | "Web Cartão"; status: string; updated_at: string };

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ projects: 0, menus: 0, cards: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("bem-vindo(a)");
  const [recent, setRecent] = useState<RecentCreation[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) { if (active) setLoading(false); return; }
      const [{ data: profile }, { data: projects }, { data: cards }] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
        supabase.from("menu_projects").select("id,project_name,business_name,status,menu_data,updated_at").order("updated_at", { ascending: false }),
        supabase.from("web_cards").select("id,business_name,status,slug,updated_at").order("updated_at", { ascending: false }),
      ]);
      if (!active) return;
      const savedName = profile?.name?.trim() || user.user_metadata?.name || user.user_metadata?.full_name || "";
      if (typeof savedName === "string" && savedName.trim()) setDisplayName(savedName.trim());
      const projectRows = projects ?? [];
      const cardRows = cards ?? [];
      const published = cardRows.filter(card => card.status === "published").length;
      const drafts = cardRows.filter(card => card.status === "draft").length;
      setStats({
        projects: projectRows.length,
        menus: projectRows.filter(project => project.menu_data !== null).length,
        cards: cardRows.length,
        published,
        drafts,
      });
      const activity: RecentCreation[] = [
        ...projectRows.map(project => ({ id: project.id, name: project.business_name || project.project_name, kind: "Projeto" as const, status: project.status || (project.menu_data ? "Com cardápio" : "Em criação"), updated_at: project.updated_at })),
        ...cardRows.map(card => ({ id: card.id, name: card.business_name, kind: "Web Cartão" as const, status: card.status === "published" ? "Publicado" : card.status === "draft" ? "Rascunho" : "Arquivado", updated_at: card.updated_at })),
      ];
      setRecent(activity.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#f6f9fd] px-4 py-7 text-slate-800 sm:px-7 sm:py-10 lg:px-10">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6 lg:flex-row lg:items-start">
        <aside aria-label="Menu lateral da Wave" className="w-full shrink-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)] lg:sticky lg:top-20 lg:w-60">
          <div className="mb-4 flex items-center gap-2 px-2">
            <img src="/wave-logo.svg" alt="" className="size-8 object-contain" />
            <div><p className="text-sm font-bold tracking-wide text-slate-900">WAVE</p><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Acesso rápido</p></div>
          </div>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1" aria-label="Funcionalidades">
            <Link to="/" className="flex items-center gap-3 rounded-xl bg-cyan-50 px-3 py-3 text-sm font-bold text-cyan-800 ring-1 ring-cyan-100 transition hover:bg-cyan-100">
              <Home className="size-4 shrink-0" /> Início
            </Link>
            <Link to="/projects" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-cyan-700">
              <BriefcaseBusiness className="size-4 shrink-0" /> Projetos
            </Link>
            <Link to="/clients" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-700">\n              <Users className="size-4 shrink-0" /> Clientes\n            </Link>\n            <Link to="/web-cards" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-violet-700">
              <QrCode className="size-4 shrink-0" /> Web Cartões
            </Link>
            <Link to="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-700">
              <UserRound className="size-4 shrink-0" /> Meu perfil
            </Link>
          </nav>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <a href="https://wa.me/5541995821280" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-[#eafaf1] px-3 py-3 text-sm font-bold text-[#16834b] transition hover:bg-[#d8f5e5] hover:shadow-sm">
              <MessageCircle className="size-5 shrink-0" /> Suporte no WhatsApp
              <ArrowUpRight className="ml-auto size-4 shrink-0" />
            </a>
            <p className="mt-2 px-1 text-[11px] leading-4 text-slate-400">Fale com a equipe Wave pelo WhatsApp.</p>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
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
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Olá, {displayName}.</h1>
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
            <p className="mt-1 text-xs text-slate-400">{loading ? "Carregando..." : `${stats.menus} com cardápio criado`}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)]">
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Web Cartões</span><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><QrCode className="size-5" /></span></div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{loading ? "—" : stats.cards}</p>
            <p className="mt-1 text-xs text-slate-400">{loading ? "Carregando..." : `${stats.published} publicados · ${stats.drafts} rascunhos`}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)]">
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Central de trabalho</span><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Activity className="size-5" /></span></div>
            <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">Wave Workspace</p>
            <p className="mt-1 text-xs text-slate-400">Suas ferramentas em um único ambiente</p>
          </div>
        </section>

        <section className="mt-8 rounded-[1.65rem] border border-slate-200/80 bg-white p-5 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)] sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#2998c9]">Acompanhe sua produção</p><h2 className="mt-1 font-display text-2xl font-semibold text-slate-900">Criações recentes</h2></div>
            <div className="flex gap-2"><Link to="/projects" className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">Ver projetos</Link><Link to="/web-cards" className="rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50">Ver cartões</Link></div>
          </div>
          {loading ? <p className="py-8 text-center text-sm text-slate-400">Carregando suas criações...</p> : recent.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-9 text-center"><p className="font-semibold text-slate-700">Suas criações aparecerão aqui</p><p className="mt-1 text-sm text-slate-400">Crie seu primeiro projeto ou Web Cartão para começar.</p></div> : <div className="divide-y divide-slate-100">{recent.map(item => <div key={item.kind + item.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1 last:pb-1"><div className="flex min-w-0 items-center gap-3"><span className={`rounded-xl p-2.5 ${item.kind === "Projeto" ? "bg-cyan-50 text-cyan-700" : "bg-violet-50 text-violet-700"}`}>{item.kind === "Projeto" ? <ClipboardList className="size-5" /> : <QrCode className="size-5" />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.name}</p><p className="mt-0.5 text-xs text-slate-400">{item.kind} · {new Date(item.updated_at).toLocaleDateString("pt-BR")}</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{item.status}</span></div>)}</div>}
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
