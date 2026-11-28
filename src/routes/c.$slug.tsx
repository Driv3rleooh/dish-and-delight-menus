import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { WebCard, WebCardOption } from "@/lib/web-card";

type PublicWebCard = Pick<WebCard, "id" | "slug" | "business_name" | "tagline" | "cover_image" | "logo_image" | "background_color" | "surface_color" | "button_color" | "text_color" | "muted_text_color" | "button_style" | "font_family"> & { options: WebCardOption[]; status: "published" };

export const Route = createFileRoute("/c/$slug")({ ssr: false, component: PublicWebCard });
function PublicWebCard() {
  const { slug } = Route.useParams();
  const [card,setCard] = useState<PublicWebCard|null>(null);
  const [loading,setLoading] = useState(true);
  const [loadError,setLoadError] = useState(false);
  useEffect(()=>{let active=true;void supabase.from("web_cards").select("id,slug,business_name,tagline,cover_image,logo_image,background_color,surface_color,button_color,text_color,muted_text_color,button_style,font_family,options,status").eq("slug",slug).eq("status","published").maybeSingle().then(({data,error})=>{if(active){setCard(data as unknown as PublicWebCard|null);setLoadError(Boolean(error));setLoading(false);}}).catch(()=>{if(active){setLoadError(true);setLoading(false);}});return()=>{active=false;};},[slug]);
  if(loading) return <main className="grid min-h-screen place-items-center bg-neutral-950 text-white">Carregando cartão…</main>;
  if(!card) return <main className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-center text-white"><div><h1 className="text-2xl font-bold">Cartão não encontrado</h1><p className="mt-2 text-white/60">{loadError?"Não foi possível carregar este cartão. Tente novamente.":"Este estabelecimento não está disponível no momento."}</p></div></main>;
  const radius=card.button_style==="pill"?"999px":card.button_style==="square"?"8px":"16px";
  const safeLink = (value: string) => { try { const url = new URL(value); return ["https:","http:","mailto:","tel:"].includes(url.protocol) ? url.href : undefined; } catch { return undefined; } };
  return <main className="min-h-screen px-4 py-3" style={{background:card.background_color,color:card.text_color,fontFamily:card.font_family}}>
    <div className="mx-auto min-h-[calc(100vh-24px)] w-full max-w-[430px] overflow-hidden pb-6">
      <header className="relative flex min-h-[190px] flex-col items-center justify-end overflow-hidden rounded-b-2xl px-5 pb-5 pt-8 text-center">
        {card.cover_image&&<img src={card.cover_image} alt="" className="absolute inset-0 size-full object-cover"/>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"/>
        <div className="relative z-10 flex flex-col items-center">{card.logo_image&&<img src={card.logo_image} alt="Logo" className="mb-2 size-20 rounded-full border-2 border-white/80 bg-black/50 object-cover"/>}<h1 className="text-2xl font-bold text-white drop-shadow">{card.business_name}</h1>{card.tagline&&<p className="mt-1 text-[10px] uppercase tracking-[.28em] text-white/85">{card.tagline}</p>}</div>
      </header>
      <section className="space-y-2.5 px-1 pt-5">{card.options.filter(o=>o.enabled).map(o=><a key={o.id} href={safeLink(o.url)} target={safeLink(o.url)?.startsWith("http")?"_blank":undefined} rel={safeLink(o.url)?.startsWith("http")?"noopener noreferrer":undefined} className="flex min-h-[58px] items-center gap-3 border px-3 py-2.5 transition active:scale-[.99]" style={{background:card.surface_color,borderColor:card.button_color,borderRadius:radius,color:card.text_color}}><div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg">{o.image_url?<img src={o.image_url} alt="" className="size-full object-cover"/>:<span className="text-2xl">{o.icon}</span>}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold leading-tight">{o.title}</p>{o.description&&<p className="mt-0.5 text-[10px] leading-tight" style={{color:card.muted_text_color}}>{o.description}</p>}</div><ChevronRight className="size-4 shrink-0" style={{color:card.button_color}}/></a>)}</section>
      <footer className="mt-7 text-center text-[10px]" style={{color:card.muted_text_color}}>Conectado com <strong>Wave</strong></footer>
    </div>
  </main>;
}
