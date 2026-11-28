revoke all privileges on table public.web_cards from anon, authenticated;
grant select (
  id, slug, business_name, tagline, cover_image, logo_image,
  background_color, surface_color, button_color, text_color,
  muted_text_color, button_style, font_family, options, status
) on table public.web_cards to anon;
grant select, insert, update, delete on table public.web_cards to authenticated;
