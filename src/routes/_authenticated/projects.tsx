import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BriefcaseBusiness, ClipboardList, Plus, Search, Pencil, Eye, Save, ArrowLeft, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MenuEditor } from "@/components/MenuEditor";
import { TEMPLATES, type Menu } from "@/lib/menu";

type Project = {
  id: string; user_id: string; project_name: string; client_name: string;
  business_name: string; niche: string; phone: string | null; email: string | null;
  instagram: string | null; address: string | null; project_description: string | null;
  status: string; menu_data: Menu | null; created_at: string; updated_at: string;
};
type Tab = "create" | "edit" | "consult";
const initialForm = { project_name: "", client_name: "", business_name: "", niche: "", phone: "", email: "", instagram: "", address: "", project_description: "" };

export const Route = createFileRoute("/_authenticated/projects")({
  ssr: false,
  head: () => ({ meta: [{ title: "Projetos e cardápios — Wave" }, { name: "description", content: "Cadastre clientes e gerencie seus projetos de cardápio." }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [tab, setTab] = useState<Tab>("create");
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(initialForm);
  const [selected, setSelected] = useState<Project | null>(null);
  const [draft, setDraft] = useState<Menu | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newProjectId, setNewProjectId] = useState<string | null>(null);

  const loadProjects = async () => {
    const { data, error } = await supabase.from("menu_projects").select("*").order("updated_at", { ascending: false });
    if (error) { toast.error("Não foi possível carregar os projetos."); return; }
    setProjects((data ?? []) as Project[]);
  };
  useEffect(() => {
    let active = true;
    void supabase.from("menu_projects").select("*").order("updated_at", { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      if (error) toast.error("Não foi possível carregar os projetos.");
      else setProjects((data ?? []) as Project[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => projects.filter(p => [p.project_name, p.client_name, p.business_name, p.niche].join(" ").toLowerCase().includes(search.toLowerCase())), [projects, search]);
  const startEdit = (project: Project) => {
    setSelected(project);
    setDraft(project.menu_data ? structuredClone(project.menu_data) : null);
    setTab("edit");
    setNewProjectId(null);
  };
  const createProject = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada. Entre novamente.");
      const { data, error } = await supabase.from("menu_projects").insert({
        ...form, user_id: auth.user.id, phone: form.phone || null, email: form.email || null,
        instagram: form.instagram || null, address: form.address || null,
        project_description: form.project_description || null,
      }).select("*").single();
      if (error) throw error;
      const project = data as Project;
      setProjects(current => [project, ...current]);
      setSelected(project); setDraft(null); setNewProjectId(project.id);
      toast.success("Cadastro do projeto criado. Agora escolha um modelo de cardápio.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível criar o projeto."); }
    finally { setBusy(false); }
  };
  const chooseTemplate = async (templateId: string) => {
    if (!selected) return;
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const menu = template.make();
    menu.name = selected.business_name || menu.name;
    setDraft(menu);
    setNewProjectId(null);
    setTab("edit");
    const { data, error } = await supabase.from("menu_projects").update({ menu_data: menu as never, updated_at: new Date().toISOString() }).eq("id", selected.id).select("*").single();
    if (error) { toast.error("Modelo escolhido, mas não foi possível salvar no projeto."); return; }
    const updated = data as Project; setSelected(updated);
    setProjects(current => current.map(p => p.id === updated.id ? updated : p));
    toast.success("Modelo adicionado ao projeto.");
  };
  const saveMenu = async () => {
    if (!selected || !draft) return;
    setBusy(true);
    const { data, error } = await supabase.from("menu_projects").update({ menu_data: draft as never, updated_at: new Date().toISOString() }).eq("id", selected.id).select("*").single();
    setBusy(false);
    if (error) { toast.error("Não foi possível salvar as alterações."); return; }
    const updated = data as Project; setSelected(updated);
    setProjects(current => current.map(p => p.id === updated.id ? updated : p));
    toast.success("Cardápio salvo com sucesso.");
  };
  const updateProjectStatus = async (status: string) => {
    if (!selected) return;
    const { data, error } = await supabase.from("menu_projects").update({ status, updated_at: new Date().toISOString() }).eq("id", selected.id).select("*").single();
    if (error) { toast.error("Não foi possível atualizar o status."); return; }
    const updated = data as Project; setSelected(updated);
    setProjects(current => current.map(p => p.id === updated.id ? updated : p));
  };

  if (selected && !draft && tab === "edit") return <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-5xl px-5 py-10 sm:px-8">
    <button onClick={() => { setSelected(null); setTab("edit"); void loadProjects(); }} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Voltar aos projetos</button>
    <div className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-primary">Projeto selecionado</p><h1 className="mt-2 font-display text-3xl">{selected.project_name}</h1><p className="mt-1 text-muted-foreground">{selected.business_name} · {selected.client_name}</p></div>
    <section className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-bold">Este projeto ainda não tem cardápio</h2><p className="mt-1 text-sm text-muted-foreground">Escolha um modelo para iniciar a criação. O cadastro do cliente será mantido neste projeto.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TEMPLATES.map(t=><button key={t.id} onClick={()=>void chooseTemplate(t.id)} className="rounded-xl border p-4 text-left transition hover:border-primary hover:shadow-sm"><span className="font-semibold">{t.label}</span><span className="mt-1 block text-xs text-muted-foreground">{t.kind}</span></button>)}</div></section>
  </main>;

  if (selected && draft && tab === "edit") return <main className="min-h-screen bg-background">
    <div className="no-print sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-6">
      <button onClick={() => { setSelected(null); setDraft(null); setTab("edit"); void loadProjects(); }} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar aos projetos</button>
      <div className="flex items-center gap-2"><span className="hidden text-sm text-muted-foreground sm:inline">{selected.project_name}</span><button onClick={saveMenu} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4" />{busy ? "Salvando…" : "Salvar cardápio"}</button></div>
    </div>
    <MenuEditor menu={draft} onChange={setDraft} onBack={() => { setSelected(null); setDraft(null); setTab("edit"); void loadProjects(); }} />
  </main>;

  return <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Painel de produção</p><h1 className="mt-2 font-display text-3xl sm:text-4xl">Projetos de cardápio</h1><p className="mt-2 max-w-2xl text-muted-foreground">Cadastre o cliente e o negócio primeiro. Depois crie, edite e consulte todos os cardápios em um só lugar.</p></div>
      <div className="rounded-xl border bg-card px-4 py-3"><p className="text-xs text-muted-foreground">Projetos cadastrados</p><p className="text-2xl font-bold tabular-nums">{projects.length}</p></div>
    </div>
    <div className="mb-7 grid grid-cols-3 gap-2 rounded-xl border bg-muted/40 p-1">
      {([{id:"create",label:"Criação",icon:Plus},{id:"edit",label:"Edição",icon:Pencil},{id:"consult",label:"Consulta",icon:Eye}] as const).map(item => <button key={item.id} onClick={() => { setTab(item.id); setSelected(null); setDraft(null); setNewProjectId(null); }} className={`flex items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-semibold transition ${tab===item.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><item.icon className="size-4" />{item.label}</button>)}
    </div>

    {tab === "create" && <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
      <div className="mb-7 flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><BriefcaseBusiness className="size-6" /></div><div><h2 className="text-xl font-bold">Cadastro prévio do projeto</h2><p className="mt-1 text-sm text-muted-foreground">Essas informações identificam o cliente e ficam vinculadas a todos os cardápios deste projeto.</p></div></div>
      <form onSubmit={createProject} className="space-y-6">
        <div><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary">Identificação do projeto e cliente</h3><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do projeto *" value={form.project_name} onChange={v=>setForm({...form,project_name:v})} placeholder="Ex.: Cardápio de verão 2026" required />
          <Field label="Nome do cliente / responsável *" value={form.client_name} onChange={v=>setForm({...form,client_name:v})} placeholder="Nome completo" required />
          <Field label="Nome do estabelecimento *" value={form.business_name} onChange={v=>setForm({...form,business_name:v})} placeholder="Nome comercial" required />
          <div><label className="mb-2 block text-sm font-medium">Nicho / segmento *</label><select required value={form.niche} onChange={e=>setForm({...form,niche:e.target.value})} className="h-11 w-full rounded-md border bg-background px-3"><option value="">Selecione o segmento</option>{["Restaurante","Pizzaria","Hamburgueria","Cafeteria","Padaria","Bar / Pub","Confeitaria","Açaí / Sorveteria","Food truck","Delivery","Buffet / Eventos","Hotel / Pousada","Outro"].map(x=><option key={x}>{x}</option>)}</select></div>
        </div></div>
        <div><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary">Contato e presença digital</h3><div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone / WhatsApp" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="(00) 00000-0000" />
          <Field label="E-mail de contato" value={form.email} onChange={v=>setForm({...form,email:v})} type="email" placeholder="contato@empresa.com" />
          <Field label="Instagram" value={form.instagram} onChange={v=>setForm({...form,instagram:v})} placeholder="@seuestabelecimento" />
          <Field label="Endereço" value={form.address} onChange={v=>setForm({...form,address:v})} placeholder="Rua, número, cidade - UF" />
        </div></div>
        <div><label className="mb-2 block text-sm font-medium" htmlFor="project-description">Descrição e briefing do projeto</label><textarea id="project-description" rows={4} maxLength={3000} value={form.project_description} onChange={e=>setForm({...form,project_description:e.target.value})} placeholder="Conte sobre o negócio, público-alvo, identidade visual, objetivos do cardápio, referências, necessidades especiais e observações importantes…" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /><p className="mt-1 text-right text-xs text-muted-foreground">{form.project_description.length}/3000</p></div>
        <div className="flex flex-col justify-between gap-3 border-t pt-5 sm:flex-row sm:items-center"><p className="text-xs text-muted-foreground">* Campos obrigatórios. O cardápio será criado na próxima etapa, após salvar o cadastro.</p><button disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Plus className="size-4" />{busy ? "Criando projeto…" : "Salvar cadastro e escolher modelo"}</button></div>
      </form>
      {newProjectId && selected?.id===newProjectId && <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4"><h3 className="font-semibold">Cadastro concluído. Escolha um modelo para começar:</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TEMPLATES.map(t=><button key={t.id} onClick={()=>void chooseTemplate(t.id)} className="rounded-lg border bg-card p-4 text-left transition hover:border-primary hover:shadow-sm"><span className="font-semibold">{t.label}</span><span className="mt-1 block text-xs text-muted-foreground">{t.kind}</span></button>)}</div></div>}
    </section>}

    {tab !== "create" && <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">{tab==="edit"?"Escolha um projeto para editar":"Consulta de projetos"}</h2><p className="text-sm text-muted-foreground">{tab==="edit"?"Abra o projeto e continue o cardápio salvo.":"Visualize os dados cadastrais e o andamento de cada projeto."}</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente, projeto ou nicho" className="h-10 w-full rounded-md border bg-card pl-9 pr-3 text-sm" /></div></div>
      {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Carregando projetos…</p> : filtered.length===0 ? <div className="rounded-2xl border border-dashed p-10 text-center"><ClipboardList className="mx-auto size-9 text-muted-foreground" /><h3 className="mt-3 font-semibold">Nenhum projeto encontrado</h3><p className="mt-1 text-sm text-muted-foreground">Cadastre um projeto na aba Criação para começar.</p></div> : <div className="grid gap-4 md:grid-cols-2">{filtered.map(project=><article key={project.id} className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{project.niche}</p><h3 className="mt-1 truncate text-lg font-bold">{project.project_name}</h3><p className="text-sm text-muted-foreground">{project.business_name} · {project.client_name}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${project.status==="active"?"bg-emerald-500/10 text-emerald-700":project.status==="completed"?"bg-blue-500/10 text-blue-700":"bg-muted text-muted-foreground"}`}>{project.status==="active"?"Ativo":project.status==="completed"?"Concluído":"Pausado"}</span></div><div className="mt-4 space-y-1 text-sm text-muted-foreground">{project.phone&&<p>Telefone: {project.phone}</p>}{project.email&&<p>E-mail: {project.email}</p>}<p>Cardápio: {project.menu_data?"Criado":"Ainda não iniciado"}</p><p>Atualizado em {new Date(project.updated_at).toLocaleDateString("pt-BR")}</p></div>{tab==="consult"&&project.project_description&&<p className="mt-3 border-t pt-3 text-sm">{project.project_description}</p>}<div className="mt-4 flex flex-wrap gap-2 border-t pt-4">{tab==="edit"?<button onClick={()=>startEdit(project)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Pencil className="size-4" />{project.menu_data?"Editar cardápio":"Escolher modelo"}</button>:<><button onClick={()=>{setSelected(project);setDraft(project.menu_data);}} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold"><Eye className="size-4" />Ver cadastro</button><button onClick={()=>{setSelected(project);setDraft(project.menu_data);setTab("edit");}} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold"><Pencil className="size-4" />Abrir edição</button></>}</div></article>)}</div>}
      {selected && tab==="consult" && <div className="mt-5 rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">Detalhes: {selected.project_name}</h3><button onClick={()=>setSelected(null)} className="text-sm text-muted-foreground">Fechar</button></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><b>Cliente:</b> {selected.client_name}</p><p><b>Estabelecimento:</b> {selected.business_name}</p><p><b>Segmento:</b> {selected.niche}</p><p><b>Telefone:</b> {selected.phone||"—"}</p><p><b>E-mail:</b> {selected.email||"—"}</p><p><b>Instagram:</b> {selected.instagram||"—"}</p><p><b>Endereço:</b> {selected.address||"—"}</p></div>{selected.project_description&&<p className="mt-4 border-t pt-4 text-sm">{selected.project_description}</p>}<div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4"><label className="text-sm font-medium" htmlFor="project-status">Status:</label><select id="project-status" value={selected.status} onChange={e=>void updateProjectStatus(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="active">Ativo</option><option value="paused">Pausado</option><option value="completed">Concluído</option></select></div></div>}
    </section>}
  </main>;
}

function Field({label,value,onChange,placeholder,type="text",required=false}:{label:string;value:string;onChange:(value:string)=>void;placeholder?:string;type?:"text"|"email";required?:boolean}) {
  return <div><label className="mb-2 block text-sm font-medium">{label}</label><input type={type} required={required} maxLength={160} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div>;
}
