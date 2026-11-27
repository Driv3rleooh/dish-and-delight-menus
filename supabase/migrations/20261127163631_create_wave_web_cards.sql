create table if not exists public.web_cards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.menu_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  business_name text not null,
  tagline text not null default '',
  cover_image text,
  logo_image text,
  background_color text not null default '#111111',
  surface_color text not null default '#1b1b1b',
  button_color text not null default '#c18a3d',
  text_color text not null default '#ffffff',
  muted_text_color text not null default '#b7b7b7',
  button_style text not null default 'rounded',
  font_family text not null default 'Inter, sans-serif',
  options jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists web_cards_project_id_idx on public.web_cards(project_id);
create index if not exists web_cards_user_id_idx on public.web_cards(user_id);
create index if not exists web_cards_public_slug_idx on public.web_cards(slug) where status = 'published';

alter table public.web_cards enable row level security;
grant select on public.web_cards to anon;
grant select, insert, update, delete on public.web_cards to authenticated;

create policy "Public can read published web cards"
on public.web_cards for select to anon, authenticated
using (status = 'published' or (select auth.uid()) = user_id);

create policy "Owners can create web cards"
on public.web_cards for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Owners can update web cards"
on public.web_cards for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners can delete web cards"
on public.web_cards for delete to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wave-web-card-assets', 'wave-web-card-assets', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create policy "Public can view Wave web card assets"
on storage.objects for select to anon, authenticated
using (bucket_id = 'wave-web-card-assets');

create policy "Authenticated owners can upload Wave web card assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'wave-web-card-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Authenticated owners can update Wave web card assets"
on storage.objects for update to authenticated
using (bucket_id = 'wave-web-card-assets' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'wave-web-card-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Authenticated owners can delete Wave web card assets"
on storage.objects for delete to authenticated
using (bucket_id = 'wave-web-card-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
