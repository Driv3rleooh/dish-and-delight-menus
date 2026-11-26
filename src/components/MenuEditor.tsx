import { useRef } from "react";
import { ArrowLeft, ImagePlus, Plus, Printer, Trash2, X } from "lucide-react";
import { type Menu, type Item, uid, TEMPLATES } from "@/lib/menu";

const THEMES = TEMPLATES.filter((t) => t.id !== "blank");

export function MenuEditor({ menu, onChange, onBack }: { menu: Menu; onChange: (m: Menu) => void; onBack: () => void }) {
  const set = (p: Partial<Menu>) => onChange({ ...menu, ...p });
  const setSec = (sid: string, fn: (s: Menu["sections"][number]) => Menu["sections"][number] | null) =>
    set({ sections: menu.sections.flatMap((s) => (s.id === sid ? (fn(s) ?? []) : [s])) });
  const setItem = (sid: string, iid: string, p: Partial<Item> | null) =>
    setSec(sid, (s) => ({ ...s, items: s.items.flatMap((i) => (i.id === iid ? (p ? [{ ...i, ...p }] : []) : [i])) }));

  return (
    <div className={`tpl-${menu.template} min-h-screen bg-menu-bg text-menu-fg font-menu-body`}>
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-card px-4 py-3 text-foreground font-sans">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Modelos</button>
        <div className="mx-auto flex gap-1">
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => set({ template: t.id })}
              className={`tpl-${t.id} rounded-full border-2 bg-menu-bg px-3 py-1 text-xs font-semibold text-menu-fg ${menu.template === t.id ? "border-primary" : "border-transparent"}`}>{t.label}</button>
          ))}
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"><Printer className="size-4" /> Imprimir / PDF</button>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-14">
        <header className="mb-12 text-center">
          <input className="menu-input text-center font-menu-title text-5xl md:text-6xl text-menu-fg" value={menu.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nome do lugar" />
          <input className="menu-input mt-2 text-center text-sm uppercase tracking-[0.3em] text-menu-accent" value={menu.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Slogan (opcional)" />
        </header>

        {menu.sections.map((s) => (
          <section key={s.id} className="group/sec mb-12">
            <div className="mb-5 flex items-center gap-3 border-b border-menu-accent/40 pb-2">
              <input className="menu-input font-menu-title text-3xl text-menu-accent" value={s.title} onChange={(e) => setSec(s.id, (x) => ({ ...x, title: e.target.value }))} />
              <button title="Remover seção" onClick={() => confirm("Remover esta seção?") && setSec(s.id, () => null)} className="no-print opacity-0 group-hover/sec:opacity-60 hover:!opacity-100"><Trash2 className="size-4" /></button>
            </div>
            <div className="space-y-4">
              {s.items.map((i) => <ItemRow key={i.id} item={i} onChange={(p) => setItem(s.id, i.id, p)} />)}
            </div>
            <button onClick={() => setSec(s.id, (x) => ({ ...x, items: [...x.items, { id: uid(), name: "Novo item", desc: "", price: "R$ 0" }] }))}
              className="no-print mt-4 flex items-center gap-1 text-sm text-menu-muted hover:text-menu-accent"><Plus className="size-4" /> Adicionar item</button>
          </section>
        ))}

        <button onClick={() => set({ sections: [...menu.sections, { id: uid(), title: "Nova seção", items: [] }] })}
          className="no-print mx-auto flex items-center gap-2 rounded-full border-2 border-dashed border-menu-accent/50 px-5 py-2 text-menu-accent hover:border-menu-accent"><Plus className="size-4" /> Nova seção</button>

        <input className="menu-input mt-14 text-center text-sm text-menu-muted" value={menu.footer} onChange={(e) => set({ footer: e.target.value })} placeholder="Rodapé: horário, endereço, contato..." />
      </div>
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
  return (
    <div className="group/item flex gap-4 rounded-lg bg-menu-card p-3">
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {item.image ? (
        <div className="relative shrink-0">
          <img src={item.image} alt={item.name} onClick={() => file.current?.click()} className="size-20 cursor-pointer rounded-md object-cover" />
          <button title="Remover foto" onClick={() => onChange({ image: undefined })} className="no-print absolute -right-2 -top-2 hidden rounded-full bg-menu-fg p-0.5 text-menu-bg group-hover/item:block"><X className="size-3" /></button>
        </div>
      ) : (
        <button onClick={() => file.current?.click()} className="no-print flex size-20 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-menu-muted/50 text-[10px] text-menu-muted hover:text-menu-accent"><ImagePlus className="size-5" />Foto</button>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <input className="menu-input text-lg font-semibold" value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
          <input className="menu-input w-24 shrink-0 text-right font-semibold text-menu-accent" value={item.price} onChange={(e) => onChange({ price: e.target.value })} />
        </div>
        <textarea rows={2} className="menu-input resize-none text-sm text-menu-muted" value={item.desc} placeholder="Descrição" onChange={(e) => onChange({ desc: e.target.value })} />
      </div>
      <button title="Remover item" onClick={() => onChange(null)} className="no-print self-start opacity-0 group-hover/item:opacity-60 hover:!opacity-100"><Trash2 className="size-4" /></button>
    </div>
  );
}
