import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Plus, Store, Pencil, ExternalLink, Copy, Trash2, ImagePlus, Eye, EyeOff, QrCode, Palette, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_WEB_OPTIONS, makeSlug, type WebCard, type WebCardOption } from "@/lib/web-card";
import { getWebCardUrl } from "@/lib/public-url";

type Project = { id: string; project_name: string; client_name: string; business_name: string; niche: string; phone: string | null; email: string | null; instagram: string | null; address: string | null; project_description: string | null; user_id: string };
const blankProject = { project_name: "", client_name: "", business_name: "", niche: "Restaurante", phone: "", email: "", instagram: "", address: "", project_description: "" };
type StyleForm = { tagline: string; cover_image: string | null; logo_image: string | null; background_color: string; surface_color: string; button_color: string; text_color: string; muted_text_color: string; button_style: "rounded" | "pill" | "square"; font_family: string };
const blankStyle: StyleForm = { tagline: "", cover_image: null as string | null, logo_image: null as string | null, background_color: "#111111", surface_color: "#1b1b1b", button_color: "#c18a3d", text_color: "#ffffff", muted_text_color: "#b7b7b7", button_style: "rounded" as const, font_family: "Inter, sans-serif" };

export const Route = createFileRoute("/_authenticated/web-cards")({ ssr: false, head: () => ({ meta: [{ title: "Web Cartões — Wave" }] }), component: WebCardsPage });

function WebCardsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [cards, setCards] = useState<WebCard[]>([]);
  const [selected, setSelected] = useState<WebCard | null>(null);
  const [projectForm, setProjectForm] = useState(blankProject);
  const [projectChoice, setProjectChoice] = useState("new");
  const [form, setForm] = useState<StyleForm>(blankStyle);
  const [options, setOptions] = useState<WebCardOption[]>(DEFAULT_WEB_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [{ data: p, error: pe }, { data: c, error: ce }] = await Promise.all([
      supabase.from("menu_projects").select("id,project_name,client_name,business_name,niche,phone,email,instagram,address,project_description,user_id").order("updated_at", { ascending: false }),
      supabase.from("web_cards").select("*").order("updated_at", { ascending: false }),
    ]);
    if (pe || ce) toast.error("Não foi possível carregar todos os Web Cartões.");
    setProjects((p ?? []) as Project[]); setCards((c ?? []) as WebCard[]); setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const publicUrl = (card: WebCard) => getWebCardUrl(card.slug);

  const createCard = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada. Entre novamente.");
      let projectId = projectChoice;
      if (projectChoice === "new") {
        const { data: project, error } = await supabase.from("menu_projects").insert({
          ...projectForm, user_id: auth.user.id, phone: projectForm.phone || null, email: projectForm.email || null,
          instagram: projectForm.instagram || null, address: projectForm.address || null, project_description: projectForm.project_description || null,
        }).select("id").single();
        if (error) throw error;
        projectId = project.id;
      }
      const chosenProject = projects.find(p => p.id === projectId);
      const businessName = projectChoice === "new" ? projectForm.business_name : chosenProject?.business_name;
      if (!businessName) throw new Error("Não foi possível identificar o estabelecimento.");
      const { data, error } = await supabase.from("web_cards").insert({
        project_id: projectId, user_id: auth.user.id, slug: makeSlug(businessName), business_name: businessName,
        ...form, options: DEFAULT_WEB_OPTIONS, status: "draft",
      }).select("*").single();
      if (error) throw error;
      toast.success("Web Cartão criado. Agora personalize e publique.");
      setSelected(data as WebCard); setForm({ ...blankStyle, ...(data as WebCard) }); setOptions((data as WebCard).options);
      setShowCreate(false); setProjectForm(blankProject); await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível criar o Web Cartão."); }
    finally { setBusy(false); }
  };

  const editCard = (card: WebCard) => { setSelected(card); setForm({ tagline: card.tagline, cover_image: card.cover_image, logo_image: card.logo_image, background_color: card.background_color, surface_color: card.surface_color, button_color: card.button_color, text_color: card.text_color, muted_text_color: card.muted_text_color, button_style: card.button_style, font_family: card.font_family }); setOptions(card.options ?? []); };
  const save = async (publish?: boolean) => {
    if (!selected) return; setBusy(true);
    const nextStatus = publish ? "published" : selected.status;
    const { data, error } = await supabase.from("web_cards").update({ ...form, options, status: nextStatus, updated_at: new Date().toISOString() }).eq("id", selected.id).select("*").single();
    setBusy(false);
    if (error) { toast.error("Não foi possível salvar o Web Cartão."); return; }
    setSelected(data as WebCard); setCards(current => current.map(c => c.id === selected.id ? data as WebCard : c));
    toast.success(publish ? "Web Cartão publicado!" : "Alterações salvas.");
  };
  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, field: "cover_image" | "logo_image", optionId?: string) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error("Escolha uma imagem JPG, PNG ou WebP de até 5 MB."); return; }
    const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${auth.user.id}/${selected.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("wave-web-card-assets").upload(path, file, { upsert: false });
    if (error) { toast.error("Falha ao enviar imagem."); return; }
    const { data } = supabase.storage.from("wave-web-card-assets").getPublicUrl(path);
    if (optionId) setOptions(current => current.map(o => o.id === optionId ? { ...o, image_url: data.publicUrl } : o));
    else setForm(current => ({ ...current, [field]: data.publicUrl }));
    toast.success("Imagem adicionada. Salve as alterações para confirmar.");
  };
  const updateOption = (id: string, patch: Partial<WebCardOption>) => setOptions(current => current.map(o => o.id === id ? { ...o, ...patch } : o));
  const addOption = () => setOptions(current => [...current, { id: crypto.randomUUID(), title: "Nova opção", description: "Descrição da opção", url: "", icon: "✨", image_url: "", enabled: true }]);
  const removeCard = async (card: WebCard) => {
    if (!confirm(`Excluir o Web Cartão de ${card.business_name}? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("web_cards").delete().eq("id", card.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    setCards(current => current.filter(c => c.id !== card.id)); if (selected?.id === card.id) setSelected(null); toast.success("Web Cartão excluído.");
  };

  if (selected) return <main className="mx-auto max-w-7xl px-4 py-7 sm:px-7">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><button onClick={() => setSelected(null)} className="mb-2 text-sm text-muted-foreground hover:text-foreground">← Voltar aos Web Cartões</button><h1 className="text-2xl font-bold">{selected.business_name}</h1><p className="text-sm text-muted-foreground">Personalização do Web Cartão</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void save(false)} disabled={busy} className="rounded-lg border px-4 py-2 text-sm font-semibold">Salvar alterações</button><button onClick={() => void save(true)} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{selected.status === "published" ? "Atualizar publicação" : "Publicar cartão"}</button></div></div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-5">
        <section className="rounded-2xl border bg-card p-5"><h2 className="mb-4 font-semibold">Identidade visual</h2><div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Nome do estabelecimento<input value={selected.business_name} disabled className="mt-1 w-full rounded-lg border bg-muted p-2.5 text-sm"/></label>
          <label className="block text-sm">Frase de apresentação<input value={form.tagline} onChange={e=>setForm({...form,tagline:e.target.value})} placeholder="Gastronomia & Churrasco" className="mt-1 w-full rounded-lg border bg-background p-2.5"/></label>
          <div><p className="mb-2 text-sm">Foto de capa</p><button onClick={()=>coverRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left"><ImagePlus className="size-5"/>{form.cover_image ? <img src={form.cover_image} className="h-16 w-24 rounded-lg object-cover"/> : "Enviar foto de capa"}</button><input ref={coverRef} hidden type="file" accept="image/*" onChange={e=>void uploadImage(e,"cover_image")}/></div>
          <div><p className="mb-2 text-sm">Logo do estabelecimento</p><button onClick={()=>logoRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left"><ImagePlus className="size-5"/>{form.logo_image ? <img src={form.logo_image} className="size-16 rounded-full object-cover"/> : "Enviar logo"}</button><input ref={logoRef} hidden type="file" accept="image/*" onChange={e=>void uploadImage(e,"logo_image")}/></div>
        </div></section>
        <section className="rounded-2xl border bg-card p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><Palette className="size-4"/> Cores e formato</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([{key:"background_color",label:"Fundo geral"},{key:"surface_color",label:"Fundo dos botões"},{key:"button_color",label:"Detalhes / bordas"},{key:"text_color",label:"Texto principal"},{key:"muted_text_color",label:"Texto secundário"}] as const).map(c=><label key={c.key} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">{c.label}<input type="color" value={form[c.key]} onChange={e=>setForm({...form,[c.key]:e.target.value})} className="size-10 cursor-pointer rounded border p-1"/></label>)}
          <label className="text-sm">Formato dos botões<select value={form.button_style} onChange={e=>setForm({...form,button_style:e.target.value as typeof form.button_style})} className="mt-1 w-full rounded-lg border bg-background p-2.5"><option value="rounded">Arredondado</option><option value="pill">Pílula</option><option value="square">Quadrado</option></select></label>
          <label className="text-sm">Tipografia<select value={form.font_family} onChange={e=>setForm({...form,font_family:e.target.value})} className="mt-1 w-full rounded-lg border bg-background p-2.5"><option>Inter, sans-serif</option><option>Arial, sans-serif</option><option>Georgia, serif</option><option>Verdana, sans-serif</option><option>Tahoma, sans-serif</option></select></label>
        </div></section>
        <section className="rounded-2xl border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Opções e links</h2><p className="text-xs text-muted-foreground">Adicione, remova, oculte e personalize cada botão.</p></div><button onClick={addOption} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Adicionar opção</button></div>
          <div className="space-y-3">{options.map((o,index)=><div key={o.id} className="rounded-xl border p-3"><div className="mb-3 flex items-center gap-2"><span className="text-xs text-muted-foreground">{index+1}.</span><button onClick={()=>updateOption(o.id,{enabled:!o.enabled})} title={o.enabled?"Ocultar":"Exibir"} className="rounded p-1">{o.enabled?<Eye className="size-4"/>:<EyeOff className="size-4 text-muted-foreground"/>}</button><strong className="min-w-0 flex-1 truncate text-sm">{o.title || "Opção sem título"}</strong><button onClick={()=>setOptions(current=>current.filter(x=>x.id!==o.id))} className="rounded p-1 text-red-600"><Trash2 className="size-4"/></button></div><div className="grid gap-2 sm:grid-cols-2"><input value={o.title} onChange={e=>updateOption(o.id,{title:e.target.value})} placeholder="Nome da opção" className="rounded-lg border bg-background p-2 text-sm"/><input value={o.description} onChange={e=>updateOption(o.id,{description:e.target.value})} placeholder="Descrição" className="rounded-lg border bg-background p-2 text-sm"/><input value={o.url} onChange={e=>updateOption(o.id,{url:e.target.value})} placeholder="Link de destino (https://...)" className="rounded-lg border bg-background p-2 text-sm sm:col-span-2"/><div className="flex items-center gap-2"><input value={o.icon} onChange={e=>updateOption(o.id,{icon:e.target.value})} maxLength={8} aria-label="Ícone emoji" className="w-16 rounded-lg border bg-background p-2 text-center"/><span className="text-xs text-muted-foreground">Emoji / ícone</span><label className="ml-auto flex cursor-pointer items-center gap-2 text-xs"><ImagePlus className="size-4"/>Foto<input type="file" accept="image/*" className="hidden" onChange={e=>void uploadImage(e,"cover_image",o.id)}/></label>{o.image_url&&<img src={o.image_url} className="size-9 rounded-md object-cover"/>}</div><div className="flex items-center gap-2 sm:col-span-2"><button disabled={index===0} onClick={()=>setOptions(current=>{const a=[...current];[a[index-1],a[index]]=[a[index],a[index-1]];return a;})} className="rounded border p-1 disabled:opacity-30"><ChevronUp className="size-4"/></button><button disabled={index===options.length-1} onClick={()=>setOptions(current=>{const a=[...current];[a[index+1],a[index]]=[a[index],a[index+1]];return a;})} className="rounded border p-1 disabled:opacity-30"><ChevronDown className="size-4"/></button><span className="text-xs text-muted-foreground">Ordem de exibição</span></div></div></div>)}</div>
        </section>
      </div>
      <aside className="xl:sticky xl:top-24"><p className="mb-2 text-sm font-semibold">Pré-visualização no celular</p><WebCardPreview card={{...selected,...form,options}}/><div className="mt-4 rounded-xl border bg-card p-3"><p className="mb-1 text-xs font-semibold text-muted-foreground">LINK PÚBLICO</p><div className="break-all text-sm">{publicUrl(selected)}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>{void navigator.clipboard.writeText(publicUrl(selected));toast.success("Link copiado.");}} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs"><Copy className="size-3.5"/>Copiar link</button><a href={`https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(publicUrl(selected))}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs"><QrCode className="size-3.5"/>Abrir QR Code</a>{selected.status==="published"&&<a href={publicUrl(selected)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs"><ExternalLink className="size-3.5"/>Abrir cartão</a>}</div></div></aside>
    </div>
  </main>;

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-7"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Wave · Experiência digital</p><h1 className="mt-2 text-3xl font-bold">Web Cartões</h1><p className="mt-2 text-sm text-muted-foreground">Crie cartões digitais para QR Code e NFC, com acesso público direto.</p></div><button onClick={()=>{setShowCreate(true);setSelected(null);}} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="size-4"/>Novo Web Cartão</button></div>
    {showCreate&&<form onSubmit={createCard} className="mb-7 rounded-2xl border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold">Novo Web Cartão</h2><p className="text-sm text-muted-foreground">Vincule a um projeto existente ou cadastre cliente e projeto agora.</p></div><button type="button" onClick={()=>setShowCreate(false)} className="text-sm text-muted-foreground">Fechar</button></div><label className="mb-4 block text-sm font-medium">Projeto<select value={projectChoice} onChange={e=>setProjectChoice(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-3"><option value="new">Cadastrar novo cliente e projeto</option>{projects.map(p=><option key={p.id} value={p.id}>{p.business_name} — {p.project_name} ({p.client_name})</option>)}</select></label>{projectChoice==="new"&&<div className="grid gap-3 sm:grid-cols-2">{([["project_name","Nome do projeto"],["client_name","Nome do cliente"],["business_name","Nome do estabelecimento"],["niche","Segmento"],["phone","Telefone / WhatsApp"],["email","E-mail"],["instagram","Instagram"],["address","Endereço"]] as const).map(([key,label])=><label key={key} className="text-sm">{label}<input required={["project_name","client_name","business_name"].includes(key)} type={key==="email"?"email":"text"} value={projectForm[key]} onChange={e=>setProjectForm({...projectForm,[key]:e.target.value})} className="mt-1 w-full rounded-lg border bg-background p-2.5"/></label>)}<label className="text-sm sm:col-span-2">Descrição do projeto<textarea value={projectForm.project_description} onChange={e=>setProjectForm({...projectForm,project_description:e.target.value})} className="mt-1 w-full rounded-lg border bg-background p-2.5"/></label></div>}<button disabled={busy} className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{busy?"Criando…":"Criar e personalizar Web Cartão"}</button></form>}
    {loading?<p className="py-12 text-center text-muted-foreground">Carregando Web Cartões…</p>:cards.length===0?<div className="rounded-2xl border border-dashed bg-card/70 px-6 py-16 text-center"><Store className="mx-auto size-10 text-muted-foreground"/><h2 className="mt-3 text-lg font-semibold">Nenhum Web Cartão ainda</h2><p className="mt-1 text-sm text-muted-foreground">Cadastre o primeiro estabelecimento e monte seu cartão digital.</p></div>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map(card=><article key={card.id} className="rounded-2xl border bg-card p-4 shadow-sm"><div className="flex items-start gap-3"><div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">{card.cover_image?<img src={card.cover_image} className="size-full object-cover"/>:<Store className="m-5 size-6 text-muted-foreground"/>}</div><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{card.business_name}</h2><p className="truncate text-xs text-muted-foreground">/{card.slug}</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${card.status==="published"?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`}>{card.status==="published"?"PUBLICADO":"RASCUNHO"}</span></div></div><div className="mt-4 flex gap-2"><button onClick={()=>editCard(card)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm"><Pencil className="size-4"/>Editar</button><button onClick={()=>{void navigator.clipboard.writeText(getWebCardUrl(card.slug));toast.success("Link copiado.");}} className="rounded-lg border px-3 py-2"><Copy className="size-4"/></button><button onClick={()=>void removeCard(card)} className="rounded-lg border px-3 py-2 text-red-600"><Trash2 className="size-4"/></button></div></article>)}</div>}
  </main>;
}

function WebCardPreview({card}:{card:Partial<WebCard>&Pick<WebCard,"business_name"|"options">}) {
  const style = { background: card.background_color || "#111", color: card.text_color || "#fff", fontFamily: card.font_family || "Inter, sans-serif" };
  const radius = card.button_style==="pill"?"999px":card.button_style==="square"?"8px":"16px";
  return <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] border-[7px] border-neutral-900 shadow-xl" style={style}><div className="relative h-40 bg-neutral-800">{card.cover_image&&<img src={card.cover_image} className="size-full object-cover"/>}<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/><div className="absolute inset-x-4 bottom-3 flex items-end gap-3">{card.logo_image&&<img src={card.logo_image} className="size-14 rounded-full border-2 border-white object-cover"/>}<div><h3 className="text-xl font-bold text-white">{card.business_name}</h3><p className="text-[10px] tracking-[.2em] text-white/80">{card.tagline}</p></div></div></div><div className="space-y-2 p-3">{card.options.filter(o=>o.enabled).map(o=><div key={o.id} className="flex min-h-[52px] items-center gap-3 border px-3 py-2" style={{background:card.surface_color||"#1b1b1b",borderColor:card.button_color||"#c18a3d",borderRadius:radius}}>{o.image_url?<img src={o.image_url} className="size-8 rounded-md object-cover"/>:<span className="text-xl">{o.icon}</span>}<div className="min-w-0 flex-1"><p className="text-sm font-semibold">{o.title}</p><p className="truncate text-[10px]" style={{color:card.muted_text_color}}>{o.description}</p></div><span style={{color:card.button_color}}>›</span></div>)}</div></div>;
}
