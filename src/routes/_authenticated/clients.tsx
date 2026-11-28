import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Mail, Pencil, Phone, Plus, Search, Trash2, UserRound, UtensilsCrossed, QrCode, Save, Link2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Client = { id:string; user_id:string; name:string; phone:string|null; business_name:string; email:string|null; created_at:string; updated_at:string };
type Project = { id:string; client_id:string|null; project_name:string; project_description:string|null; business_name:string; client_name:string; status:string; menu_data:unknown; updated_at:string };
type WebCard = { id:string; project_id:string; business_name:string; status:string; slug:string; updated_at:string };
const empty = { name:"", phone:"", business_name:"", email:"" };

export const Route = createFileRoute("/_authenticated/clients")({ ssr:false, head:()=>({meta:[{title:"Clientes — Wave"},{name:"description",content:"Cadastro e gestão de clientes e projetos Wave."}]}), component:ClientsPage });

function ClientsPage() {
  const navigate=useNavigate();
  const [clients,setClients]=useState<Client[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const [cards,setCards]=useState<WebCard[]>([]);
  const [form,setForm]=useState(empty);
  const [editing,setEditing]=useState<string|null>(null);
  const [selected,setSelected]=useState<Client|null>(null);
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [attachId,setAttachId]=useState("");

  const load=async()=>{
    const [c,p,w]=await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("menu_projects").select("id,client_id,project_name,project_description,business_name,client_name,status,menu_data,updated_at").order("updated_at",{ascending:false}),
      supabase.from("web_cards").select("id,project_id,business_name,status,slug,updated_at").order("updated_at",{ascending:false})
    ]);
    if(c.error||p.error||w.error) toast.error("Não foi possível carregar os dados dos clientes.");
    setClients((c.data??[]) as Client[]); setProjects((p.data??[]) as Project[]); setCards((w.data??[]) as WebCard[]); setLoading(false);
    const id=new URLSearchParams(window.location.search).get("client");
    if(id){const found=(c.data??[]).find((x:Client)=>x.id===id);if(found)setSelected(found);}
  };
  useEffect(()=>{void load();},[]);
  const filtered=useMemo(()=>clients.filter(c=>[c.name,c.business_name,c.phone??"",c.email??""].join(" ").toLowerCase().includes(search.toLowerCase())),[clients,search]);
  const reset=()=>{setForm(empty);setEditing(null);};
  const save=async(e:FormEvent)=>{
    e.preventDefault();setBusy(true);
    const {data:auth}=await supabase.auth.getUser();
    if(!auth.user){setBusy(false);toast.error("Sessão expirada. Entre novamente.");return;}
    const payload={...form,user_id:auth.user.id,phone:form.phone||null,email:form.email||null};
    const result=editing
      ? await supabase.from("clients").update({name:form.name,phone:form.phone||null,business_name:form.business_name,email:form.email||null,updated_at:new Date().toISOString()}).eq("id",editing).select("*").single()
      : await supabase.from("clients").insert(payload).select("*").single();
    setBusy(false);
    if(result.error){toast.error("Não foi possível salvar o cliente.");return;}
    const saved=result.data as Client;
    setClients(current=>editing?current.map(c=>c.id===saved.id?saved:c):[saved,...current]);
    if(selected?.id===saved.id)setSelected(saved);
    reset();toast.success(editing?"Cliente atualizado.":"Cliente cadastrado.");
  };
  const beginEdit=(client:Client)=>{setEditing(client.id);setForm({name:client.name,phone:client.phone??"",business_name:client.business_name,email:client.email??""});setSelected(null);window.scrollTo({top:0,behavior:"smooth"});};
  const remove=async(client:Client)=>{
    if(!confirm("Remover este cliente? Os projetos serão preservados e ficarão sem vínculo com ele."))return;
    const {error}=await supabase.from("clients").delete().eq("id",client.id);
    if(error){toast.error("Não foi possível remover o cliente.");return;}
    setClients(current=>current.filter(c=>c.id!==client.id));setProjects(current=>current.map(p=>p.client_id===client.id?{...p,client_id:null}:p));setSelected(null);toast.success("Cliente removido. Os projetos foram preservados.");
  };
  const attach=async()=>{
    if(!selected||!attachId)return;
    const {data,error}=await supabase.from("menu_projects").update({client_id:selected.id,updated_at:new Date().toISOString()}).eq("id",attachId).select("id,client_id,project_name,project_description,business_name,client_name,status,menu_data,updated_at").single();
    if(error){toast.error("Não foi possível vincular o projeto.");return;}
    setProjects(current=>current.map(p=>p.id===data.id?data as Project:p));setAttachId("");toast.success("Projeto vinculado ao cliente.");
  };
  const openClient=(client:Client)=>{setSelected(client);reset();void navigate({to:"/clients",search:{client:client.id} as never});};
  const linkedProjects=selected?projects.filter(p=>p.client_id===selected.id):[];
  const available=projects.filter(p=>!p.client_id);

  if(selected) return <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-4 py-8 sm:px-7">
    <button onClick={()=>{setSelected(null);void navigate({to:"/clients"});}} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4"/>Voltar aos clientes</button>
    <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><div className="rounded-2xl bg-primary/10 p-4 text-primary"><UserRound className="size-8"/></div><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Perfil do cliente</p><h1 className="mt-1 text-3xl font-bold">{selected.name}</h1><p className="text-sm text-muted-foreground">{selected.business_name}</p></div></div><div className="flex gap-2"><button onClick={()=>beginEdit(selected)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Pencil className="size-4"/>Editar</button><button onClick={()=>void remove(selected)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-red-600"><Trash2 className="size-4"/>Remover</button></div></div>
      <div className="mt-7 grid gap-4 border-t pt-5 sm:grid-cols-3"><p className="flex items-center gap-2 text-sm"><Phone className="size-4 text-muted-foreground"/>{selected.phone||"Telefone não informado"}</p><p className="flex items-center gap-2 text-sm"><Mail className="size-4 text-muted-foreground"/>{selected.email||"E-mail não informado"}</p><p className="flex items-center gap-2 text-sm"><Building2 className="size-4 text-muted-foreground"/>{selected.business_name}</p></div>
    </section>
    <section className="mt-6 rounded-2xl border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Projetos associados</h2><p className="mt-1 text-sm text-muted-foreground">Cardápios e Web Cartões vinculados a este cliente.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{linkedProjects.length} projetos</span></div>
      {available.length>0&&<div className="mt-5 flex flex-col gap-2 sm:flex-row"><select value={attachId} onChange={e=>setAttachId(e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm"><option value="">Selecionar projeto existente para vincular…</option>{available.map(p=><option key={p.id} value={p.id}>{p.project_name} — {p.business_name}</option>)}</select><button onClick={()=>void attach()} disabled={!attachId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Link2 className="size-4"/>Vincular projeto</button></div>}
      {linkedProjects.length===0?<div className="mt-5 rounded-xl border border-dashed p-8 text-center"><BriefcaseBusiness className="mx-auto size-8 text-muted-foreground"/><p className="mt-2 font-semibold">Nenhum projeto associado</p><p className="mt-1 text-sm text-muted-foreground">Você pode vincular projetos existentes acima ou criar novos nas abas de produção.</p></div>:<div className="mt-5 grid gap-3 md:grid-cols-2">{linkedProjects.map(p=>{const card=cards.find(c=>c.project_id===p.id);return <article key={p.id} className="rounded-xl border p-4"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary">{card?<QrCode className="size-5"/>:<UtensilsCrossed className="size-5"/>}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{card?"Projeto com Web Cartão":"Projeto de cardápio"}</p><h3 className="mt-1 font-bold">{p.project_name}</h3><p className="text-sm text-muted-foreground">{p.business_name}</p>{p.project_description&&<p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.project_description}</p>}<p className="mt-2 text-xs text-muted-foreground">{card?("Web Cartão: "+(card.status==="published"?"Publicado":"Rascunho")):p.menu_data?"Cardápio criado":"Cardápio não iniciado"}</p></div></div><div className="mt-4 flex flex-wrap gap-2 border-t pt-3">{p.menu_data&&<button onClick={()=>void navigate({to:"/projects",search:{project:p.id} as never})} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"><Pencil className="size-3.5"/>Editar cardápio</button>}{card&&<button onClick={()=>void navigate({to:"/web-cards",search:{card:card.id} as never})} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"><Pencil className="size-3.5"/>Editar Web Cartão</button>}{!p.menu_data&&!card&&<button onClick={()=>void navigate({to:"/projects",search:{project:p.id} as never})} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"><ArrowRight className="size-3.5"/>Abrir projeto</button>}</div></article>})}</div>}
    </section>
  </main>;

  return <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-4 py-8 sm:px-7">
    <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Gestão de relacionamento</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Clientes</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Cadastre clientes e reúna todos os projetos de cardápio e Web Cartões em um único perfil.</p></div>
    <section className="mb-7 rounded-2xl border bg-card p-5 shadow-sm sm:p-7"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Plus className="size-5"/></div><div><h2 className="text-xl font-bold">{editing?"Editar cliente":"Cadastrar novo cliente"}</h2><p className="text-sm text-muted-foreground">Os projetos poderão ser associados agora ou depois.</p></div></div>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Nome do cliente *<input required maxLength={160} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nome completo" className="mt-1 h-11 w-full rounded-lg border bg-background px-3"/></label><label className="text-sm font-medium">Nome do estabelecimento *<input required maxLength={180} value={form.business_name} onChange={e=>setForm({...form,business_name:e.target.value})} placeholder="Nome comercial" className="mt-1 h-11 w-full rounded-lg border bg-background px-3"/></label><label className="text-sm font-medium">Telefone / WhatsApp<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(00) 00000-0000" className="mt-1 h-11 w-full rounded-lg border bg-background px-3"/></label><label className="text-sm font-medium">E-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="contato@empresa.com" className="mt-1 h-11 w-full rounded-lg border bg-background px-3"/></label><div className="flex flex-wrap items-center gap-2 sm:col-span-2"><button disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4"/>{busy?"Salvando…":editing?"Salvar alterações":"Cadastrar cliente"}</button>{editing&&<button type="button" onClick={reset} className="h-11 rounded-lg border px-4 text-sm">Cancelar</button>}</div></form>
    </section>
    <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Clientes cadastrados</h2><p className="text-sm text-muted-foreground">{clients.length} clientes</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente ou estabelecimento" className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm"/></div></div>
      {loading?<p className="py-12 text-center text-sm text-muted-foreground">Carregando clientes…</p>:filtered.length===0?<div className="rounded-2xl border border-dashed p-10 text-center"><UserRound className="mx-auto size-9 text-muted-foreground"/><h3 className="mt-3 font-semibold">Nenhum cliente encontrado</h3><p className="mt-1 text-sm text-muted-foreground">Cadastre o primeiro cliente acima.</p></div>:<div className="grid gap-3 md:grid-cols-2">{filtered.map(c=>{const count=projects.filter(p=>p.client_id===c.id).length;return <button key={c.id} onClick={()=>openClient(c)} className="rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><UserRound className="size-5"/></div><div className="min-w-0 flex-1"><h3 className="truncate font-bold">{c.name}</h3><p className="truncate text-sm text-muted-foreground">{c.business_name}</p><p className="mt-2 text-xs text-muted-foreground">{c.phone||"Sem telefone"} · {c.email||"Sem e-mail"}</p></div><ArrowRight className="size-4 text-muted-foreground"/></div><div className="mt-4 border-t pt-3 text-xs font-semibold text-primary">{count} projeto(s) associado(s)</div></button>})}</div>}
    </section>
  </main>;
}
