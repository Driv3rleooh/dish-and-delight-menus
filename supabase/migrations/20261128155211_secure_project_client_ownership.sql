drop policy if exists "Users can create own menu projects" on public.menu_projects;
create policy "Users can create own menu projects" on public.menu_projects
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (client_id is null or exists (
    select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())
  ))
);

drop policy if exists "Users can update own menu projects" on public.menu_projects;
create policy "Users can update own menu projects" on public.menu_projects
for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (client_id is null or exists (
    select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())
  ))
);
