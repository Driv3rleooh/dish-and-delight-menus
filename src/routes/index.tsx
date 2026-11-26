import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MenuEditor } from "@/components/MenuEditor";
import { TEMPLATES, type Menu } from "@/lib/menu";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Cardápio Fácil — crie seu cardápio em minutos" },
    { name: "description", content: "Escolha um modelo, edite pratos, preços, descrições e fotos, e imprima seu cardápio." },
    { property: "og:title", content: "Cardápio Fácil — crie seu cardápio em minutos" },
    { property: "og:description", content: "Escolha um modelo, edite pratos, preços, descrições e fotos, e imprima seu cardápio." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const KEY = "cardapio-facil";

function Index() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const s = localStorage.getItem(KEY); if (s) setMenu(JSON.parse(s)); } catch {} setReady(true); }, []);
  useEffect(() => { if (!ready) return; try { menu ? localStorage.setItem(KEY, JSON.stringify(menu)) : localStorage.removeItem(KEY); } catch {} }, [menu, ready]);

  if (menu) return <MenuEditor menu={menu} onChange={setMenu} onBack={() => confirm("Voltar aos modelos? O cardápio atual será descartado.") && setMenu(null)} />;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Cardápio Fácil</p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl leading-tight md:text-6xl">Seu cardápio pronto, do jeito do seu lugar.</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">Escolha um modelo e clique em qualquer texto para editar. Adicione fotos, pratos e seções — depois é só imprimir ou salvar em PDF.</p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => {
          const m = t.make();
          return (
            <button key={t.id} onClick={() => setMenu(t.make())} className="group overflow-hidden rounded-xl border bg-card text-left transition hover:-translate-y-1 hover:shadow-xl">
              <div className={`tpl-${m.template} h-48 bg-menu-bg p-5 text-menu-fg font-menu-body`}>
                <div className="text-center font-menu-title text-3xl">{m.name}</div>
                <div className="mt-1 text-center text-[10px] uppercase tracking-[0.3em] text-menu-accent">{m.tagline}</div>
                {m.sections[0]?.items.slice(0, 2).map((i) => (
                  <div key={i.id} className="mt-3 flex justify-between text-sm"><span>{i.name}</span><span className="text-menu-accent">{i.price}</span></div>
                ))}
              </div>
              <div className="p-4">
                <div className="font-semibold">{t.label}</div>
                <div className="text-sm text-muted-foreground">{t.kind}</div>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
