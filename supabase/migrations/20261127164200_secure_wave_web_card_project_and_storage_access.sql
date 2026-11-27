drop policy if exists "Public can view Wave web card assets" on storage.objects;

drop policy if exists "Owners can create web cards" on public.web_cards;
create policy "Owners can create web cards"
on public.web_cards for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.menu_projects mp
    where mp.id = project_id and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "Owners can update web cards" on public.web_cards;
create policy "Owners can update web cards"
on public.web_cards for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.menu_projects mp
    where mp.id = project_id and mp.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.menu_projects mp
    where mp.id = project_id and mp.user_id = (select auth.uid())
  )
);
