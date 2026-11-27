export type WebCardOption = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  image_url: string;
  enabled: boolean;
};
export type WebCard = {
  id: string;
  project_id: string;
  user_id: string;
  slug: string;
  business_name: string;
  tagline: string;
  cover_image: string | null;
  logo_image: string | null;
  background_color: string;
  surface_color: string;
  button_color: string;
  text_color: string;
  muted_text_color: string;
  button_style: "rounded" | "pill" | "square";
  font_family: string;
  options: WebCardOption[];
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};
export const DEFAULT_WEB_OPTIONS: WebCardOption[] = [
  { id: "menu", title: "Cardápio", description: "Explore nossos pratos e bebidas", url: "", icon: "🍽️", image_url: "", enabled: true },
  { id: "whatsapp", title: "WhatsApp", description: "Fale conosco rapidamente", url: "", icon: "🟢", image_url: "", enabled: true },
  { id: "instagram", title: "Instagram", description: "Siga nosso perfil e acompanhe novidades", url: "", icon: "📸", image_url: "", enabled: true },
  { id: "facebook", title: "Facebook", description: "Curta nossa página", url: "", icon: "🔵", image_url: "", enabled: true },
  { id: "pix", title: "PIX", description: "Pague de forma rápida e segura", url: "", icon: "💠", image_url: "", enabled: true },
  { id: "location", title: "Localização", description: "Veja como chegar até nós", url: "", icon: "📍", image_url: "", enabled: true },
  { id: "wifi", title: "Wi-Fi", description: "Acesse nossa rede", url: "", icon: "📶", image_url: "", enabled: true },
  { id: "reviews", title: "Google Avaliações", description: "Deixe sua avaliação e nos ajude a melhorar", url: "", icon: "⭐", image_url: "", enabled: true },
];
export const makeSlug = (name: string) => {
  const base = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "estabelecimento";
  return base + "-" + Math.random().toString(36).slice(2, 6);
};
