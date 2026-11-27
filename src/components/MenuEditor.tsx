import { useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Plus, Printer, Trash2, X, Type, MousePointer2, Move, Layers, LayoutTemplate } from "lucide-react";
import { type Menu, type Item, type CanvasElement, uid, TEMPLATES } from "@/lib/menu";

const THEMES = TEMPLATES.filter((t) => t.id !== "blank");

export function MenuEditor({ menu, onChange, onBack }: { menu: Menu; onChange: (m: Menu) => void; onBack: () => void }) {
  const [workspace, setWorkspace] = useState<"content" | "free">("content");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const elements = menu.canvasElements ?? [];
  const selectedElement = elements.find((element) => element.id === selectedId);
  const set = (p: Partial<Menu>) => onChange({ ...menu, ...p });
  const setSec = (sid: string, fn: (s: Menu["sections"][number]) => Menu["sections"][number] | null) =>
    set({ sections: menu.sections.flatMap((s) => (s.id === sid ? (fn(s) ?? []) : [s])) });
  const setItem = (sid: string, iid: string, p: Partial<Item> | null) =>
    setSec(sid, (s) => ({ ...s, items: s.items.flatMap((i) => (i.id === iid ? (p ? [{ ...i, ...p }] : []) : [i])) }));
  const updateElement = (id: string, patch: Partial<CanvasElement>) =>
    set({ canvasElements: elements.map((element) => element.id === id ? { ...element, ...patch } : element) });
  const addText = () => {
    const element: CanvasElement = { id: uid(), type: "text", content: "Seu texto aqui", x: 12, y: 12, width: 58, height: 12, fontSize: 30, color: "#18334b", bold: true };
    set({ canvasElements: [...elements, element] }); setSelectedId(element.id);
  };
  const addImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const element: CanvasElement = { id: uid(), type: "image", content: canvas.toDataURL("image/jpeg", .82), x: 15, y: 20, width: 48, height: 25 };
      set({ canvasElements: [...(menu.canvasElements ?? []), element] }); setSelectedId(element.id); URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };
  const removeSelected = () => {
    if (!selectedId) return;
    set({ canvasElements: elements.filter((element) => element.id !== selectedId) }); setSelectedId(null);
  };

  return (
    <div className={`tpl-${menu.template} min-h-screen bg-menu-bg text-menu-fg font-menu-body`}>
      <div className="no-print sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b bg-card px-4 py-3 text-foreground font-sans shadow-sm">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Projetos</button>
        <div className="mx-auto flex rounded-lg bg-muted p-1">
          <button onClick={() => setWorkspace("content")} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${workspace === "content" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><LayoutTemplate className="mr-1 inline size-3.5" /> Conteúdo</button>
          <button onClick={() => setWorkspace("free")} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${workspace === "free" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><Move className="mr-1 inline size-3.5" /> Edição livre</button>
        </div>
        <div className="flex gap-1">{THEMES.map((t) => <button key={t.id} onClick={() => set({ template: t.id })} className={`tpl-${t.id} rounded-full border-2 bg-menu-bg px-2.5 py-1 text-xs font-semibold text-menu-fg ${menu.template === t.id ? "border-primary" : "border-transparent"}`}>{t.label}</button>)}</div>
        <button onClick={() => window.print()} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"><Printer className="size-4" /> PDF</button>
      </div>

      {workspace === "content" ? <div className="mx-auto max-w-3xl px-6 py-14">
        <header className="mb-12 text-center">
          <input className="menu-input text-center font-menu-title text-5xl md:text-6xl text-menu-fg" value={menu.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nome do lugar" />
          <input className="menu-input mt-2 text-center text-sm uppercase tracking-[0.3em] text-menu-accent" value={menu.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Slogan (opcional)" />
        </header>
        {menu.sections.map((s) => <section key={s.id} className="group/sec mb-12">
          <div className="mb-5 flex items-center gap-3 border-b border-menu-accent/40 pb-2">
            <input className="menu-input font-menu-title text-3xl text-menu-accent" value={s.title} onChange={(e) => setSec(s.id, (x) => ({ ...x, title: e.target.value }))} />
            <button title="Remover seção" onClick={() => confirm("Remover esta seção?") && setSec(s.id, () => null)} className="no-print opacity-0 group-hover/sec:opacity-60 hover:!opacity-100"><Trash2 className="size-4" /></button>
          </div>
          <div className="space-y-4">{s.items.map((i) => <ItemRow key={i.id} item={i} onChange={(p) => setItem(s.id, i.id, p)} />)}</div>
          <button onClick={() => setSec(s.id, (x) => ({ ...x, items: [...x.items, { id: uid(), name: "Novo item", desc: "", price: "R$ 0" }] }))} className="no-print mt-4 flex items-center gap-1 text-sm text-menu-muted hover:text-menu-accent"><Plus className="size-4" /> Adicionar item</button>
        </section>)}
        <button onClick={() => set({ sections: [...menu.sections, { id: uid(), title: "Nova seção", items: [] }] })} className="no-print mx-auto flex items-center gap-2 rounded-full border-2 border-dashed border-menu-accent/50 px-5 py-2 text-menu-accent hover:border-menu-accent"><Plus className="size-4" /> Nova seção</button>
        <input className="menu-input mt-14 text-center text-sm text-menu-muted" value={menu.footer} onChange={(e) => set({ footer: e.target.value })} placeholder="Rodapé: horário, endereço, contato..." />
      </div> : <div className="mx-auto grid max-w-[1500px] gap-5 p-4 lg:grid-cols-[250px_minmax(0,1fr)_270px] lg:p-6">
        <aside className="no-print rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Caixa de ferramentas</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={addText} className="flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold hover:border-primary hover:bg-primary/5"><Type className="size-6 text-primary" />Texto</button>
            <button onClick={() => uploadRef.current?.click()} className="flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold hover:border-primary hover:bg-primary/5"><ImagePlus className="size-6 text-primary" />Foto</button>
          </div>
          <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(event) => { addImage(event.target.files?.[0]); event.currentTarget.value = ""; }} />
          <div className="mt-5 rounded-xl bg-sky-50 p-3 text-xs leading-relaxed text-sky-900"><MousePointer2 className="mb-1 size-4" /> Selecione um elemento e arraste no papel para posicionar. Use as opções ao lado para personalizar.</div>
          <div className="mt-5"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Layers className="size-3.5" /> Camadas ({elements.length})</p>
            <div className="space-y-1">{elements.map((element, index) => <button key={element.id} onClick={() => setSelectedId(element.id)} className={`w-full truncate rounded-lg px-3 py-2 text-left text-xs ${selectedId === element.id ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted"}`}>{index + 1}. {element.type === "text" ? element.content : "Imagem adicionada"}</button>)}</div>
          </div>
        </aside>
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>Prancheta do cardápio</span><span>Arraste para mover · alterações salvas ao clicar em Salvar cardápio</span></div>
          <div className="mx-auto w-full max-w-[760px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
            <div className="relative aspect-[760/980] w-full select-none overflow-hidden" onPointerMove={(event) => {
              const drag = (window as Window & { __waveDrag?: { id: string; dx: number; dy: number } }).__waveDrag;
              if (!drag) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(94, ((event.clientX - bounds.left) / bounds.width) * 100 - drag.dx));
              const y = Math.max(0, Math.min(96, ((event.clientY - bounds.top) / bounds.height) * 100 - drag.dy));
              updateElement(drag.id, { x, y });
            }} onPointerUp={() => { (window as Window & { __waveDrag?: unknown }).__waveDrag = undefined; }} onPointerCancel={() => { (window as Window & { __waveDrag?: unknown }).__waveDrag = undefined; }} style={{ background: menu.template === "burger" ? "#18201e" : menu.template === "bar" ? "#173d35" : menu.template === "cafe" ? "#f0dfc6" : menu.template === "fresh" ? "#eff7ed" : "#fffaf0" }}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-slate-900/10 to-transparent" />
              <div className="pointer-events-none absolute inset-x-8 top-[4%] text-center"><p className="font-serif text-[clamp(20px,4vw,42px)] font-bold tracking-wide" style={{ color: menu.template === "burger" || menu.template === "bar" ? "#fff" : "#17384b" }}>{menu.name || "Seu estabelecimento"}</p><p className="mt-1 text-[clamp(8px,1.5vw,13px)] uppercase tracking-[.28em]" style={{ color: menu.template === "burger" || menu.template === "bar" ? "#bde8e8" : "#218c9b" }}>{menu.tagline}</p></div>
              {elements.map((element) => <div key={element.id} onPointerDown={(event) => {
                event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setSelectedId(element.id);
                const rect = event.currentTarget.getBoundingClientRect(); const bounds = event.currentTarget.parentElement!.getBoundingClientRect();
                (window as Window & { __waveDrag?: { id: string; dx: number; dy: number } }).__waveDrag = { id: element.id, dx: ((event.clientX - rect.left) / bounds.width) * 100, dy: ((event.clientY - rect.top) / bounds.height) * 100 };
              }} className={`absolute cursor-grab touch-none overflow-hidden ${selectedId === element.id ? "z-10 outline outline-2 outline-blue-500 outline-offset-2" : "hover:outline hover:outline-1 hover:outline-blue-300"}`} style={{ left: `${element.x}%`, top: `${element.y}%`, width: `${element.width}%`, minHeight: `${element.height}%` }}>
                {element.type === "text" ? <div className="whitespace-pre-wrap break-words" style={{ fontSize: `clamp(10px, ${element.fontSize ?? 24}px, 54px)`, color: element.color || "#18334b", fontWeight: element.bold ? 800 : 400 }}>{element.content}</div> : <img src={element.content} alt="Elemento do cardápio" draggable={false} className="pointer-events-none h-full w-full object-cover" />}
              </div>)}
              <div className="pointer-events-none absolute inset-x-8 bottom-[5%] border-t border-current/20 pt-3 text-center text-[clamp(8px,1.2vw,12px)] opacity-60">{menu.footer}</div>
            </div>
          </div>
        </div>
        <aside className="no-print rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Personalizar elemento</p>
          {!selectedElement ? <p className="text-sm text-muted-foreground">Escolha uma camada ou adicione texto/foto para editar.</p> : <div className="space-y-4">
            {selectedElement.type === "text" && <>
              <label className="block text-xs font-semibold">Conteúdo<textarea value={selectedElement.content} onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })} rows={4} className="mt-1 w-full rounded-lg border bg-background p-2 text-sm" /></label>
              <label className="block text-xs font-semibold">Tamanho da fonte<input type="range" min="12" max="56" value={selectedElement.fontSize ?? 24} onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })} className="mt-2 w-full" /></label>
              <label className="block text-xs font-semibold">Cor<input type="color" value={selectedElement.color || "#18334b"} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="mt-1 h-10 w-full cursor-pointer rounded border p-1" /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selectedElement.bold} onChange={(e) => updateElement(selectedElement.id, { bold: e.target.checked })} /> Negrito</label>
            </>}
            <label className="block text-xs font-semibold">Largura<input type="range" min="10" max="95" value={selectedElement.width} onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })} className="mt-2 w-full" /></label>
            <button onClick={removeSelected} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="size-4" /> Excluir elemento</button>
          </div>}
          <button onClick={() => setSelectedId(null)} className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><X className="size-3.5" /> Desselecionar</button>
        </aside>
      </div>}
    </div>
  );
}

function ItemRow({ item, onChange }: { item: Item; onChange: (p: Partial<Item> | null) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const pick = (f?: File) => {
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); const max = 400; const r = Math.min(1, max / Math.max(img.width, img.height));
      c.width = img.width * r; c.height = img.height * r; c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      onChange({ image: c.toDataURL("image/jpeg", 0.8) }); URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  };
  return <div className="group/item flex gap-4 rounded-lg bg-menu-card p-3">
    <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    {item.image ? <div className="relative shrink-0"><img src={item.image} alt={item.name} onClick={() => file.current?.click()} className="size-20 cursor-pointer rounded-md object-cover" /><button title="Remover foto" onClick={() => onChange({ image: undefined })} className="no-print absolute -right-2 -top-2 hidden rounded-full bg-menu-fg p-0.5 text-menu-bg group-hover/item:block"><X className="size-3" /></button></div> : <button onClick={() => file.current?.click()} className="no-print flex size-20 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-menu-muted/50 text-[10px] text-menu-muted hover:text-menu-accent"><ImagePlus className="size-5" />Foto</button>}
    <div className="min-w-0 flex-1"><div className="flex items-baseline gap-2"><input className="menu-input text-lg font-semibold" value={item.name} onChange={(e) => onChange({ name: e.target.value })} /><input className="menu-input w-24 shrink-0 text-right font-semibold text-menu-accent" value={item.price} onChange={(e) => onChange({ price: e.target.value })} /></div><textarea rows={2} className="menu-input resize-none text-sm text-menu-muted" value={item.desc} placeholder="Descrição" onChange={(e) => onChange({ desc: e.target.value })} /></div>
    <button title="Remover item" onClick={() => onChange(null)} className="no-print self-start opacity-0 group-hover/item:opacity-60 hover:!opacity-100"><Trash2 className="size-4" /></button>
  </div>;
}
