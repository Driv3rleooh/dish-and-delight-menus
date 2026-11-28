create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  phone text,
  business_name text not null check (char_length(trim(business_name)) between 2 and 180),
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.clients enable row level security;
grant select, insert, update, delete on public.clients to authenticated;
drop policy if exists "Users can read own clients" on public.clients;
create policy "Users can read own clients" on public.clients for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create own clients" on public.clients;
create policy "Users can create own clients" on public.clients for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own clients" on public.clients;
create policy "Users can update own clients" on public.clients for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own clients" on public.clients;
create policy "Users can delete own clients" on public.clients for delete to authenticated using ((select auth.uid()) = user_id);
alter table public.menu_projects add column if not exists client_id uuid references public.clients(id) on delete set null;
insert into public.clients (user_id, name, phone, business_name, email)
select distinct mp.user_id, mp.client_name, mp.phone, mp.business_name, mp.email
from public.menu_projects mp
where mp.user_id is not null and not exists (
 select 1 from public.clients c where c.user_id=mp.user_id and c.name is not distinct from mp.client_name
 and c.phone is not distinct from mp.phone and c.business_name is not distinct from mp.business_name and c.email is not distinct from mp.email
);
update public.menu_projects mp set client_id=c.id from public.clients c
where c.user_id=mp.user_id and c.name is not distinct from mp.client_name
and c.phone is not distinct from mp.phone and c.business_name is not distinct from mp.business_name
and c.email is not distinct from mp.email and mp.client_id is null;
create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists menu_projects_client_id_idx on public.menu_projects(client_id);
