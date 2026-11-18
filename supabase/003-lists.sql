-- We Got Lists: database setup, part 3 (Milestone 3: lists and items).
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- Everything stays inside the "wgl" schema; Coconut-Water's tables are not touched.

-- ---------- Tables ----------

create table if not exists wgl.lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Who can use a list. A list with more than one member is "shared".
create table if not exists wgl.list_members (
  list_id    uuid not null references wgl.lists (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (list_id, user_id)
);
create index if not exists list_members_user_idx on wgl.list_members (user_id);

create table if not exists wgl.items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references wgl.lists (id) on delete cascade,
  text        text not null check (char_length(btrim(text)) between 1 and 200),
  done        boolean not null default false,
  done_at     timestamptz,
  -- Order on the list. Decimals, so moving an item between 2 and 3 gives it 2.5.
  position    double precision not null default 0,
  added_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists items_list_idx on wgl.items (list_id, position);

-- Your starred ("primary") list. One per person; it opens when the app starts.
alter table wgl.profiles add column if not exists primary_list_id uuid references wgl.lists (id) on delete set null;

-- ---------- Helper: am I on this list? ----------
-- "security definer" lets the rules below check membership without tripping over their own rules.
create or replace function wgl.is_member(p_list uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from wgl.list_members m where m.list_id = p_list and m.user_id = auth.uid())
$$;

-- ---------- Row Level Security ----------
alter table wgl.lists        enable row level security;
alter table wgl.list_members enable row level security;
alter table wgl.items        enable row level security;

-- Lists: members can see, rename and delete. New lists are made with wgl.create_list() below.
drop policy if exists "members read lists"   on wgl.lists;
drop policy if exists "members update lists" on wgl.lists;
drop policy if exists "members delete lists" on wgl.lists;
create policy "members read lists"   on wgl.lists for select to authenticated using (wgl.is_member(id));
create policy "members update lists" on wgl.lists for update to authenticated using (wgl.is_member(id)) with check (wgl.is_member(id));
create policy "members delete lists" on wgl.lists for delete to authenticated using (wgl.is_member(id));

-- Members: you can see who else is on your lists, and remove yourself (leave).
drop policy if exists "members read members" on wgl.list_members;
drop policy if exists "leave a list"         on wgl.list_members;
create policy "members read members" on wgl.list_members for select to authenticated using (wgl.is_member(list_id));
create policy "leave a list"         on wgl.list_members for delete to authenticated using (user_id = auth.uid());

-- Items: anyone on the list can do anything.
drop policy if exists "members read items"   on wgl.items;
drop policy if exists "members add items"    on wgl.items;
drop policy if exists "members change items" on wgl.items;
drop policy if exists "members delete items" on wgl.items;
create policy "members read items"   on wgl.items for select to authenticated using (wgl.is_member(list_id));
create policy "members add items"    on wgl.items for insert to authenticated with check (wgl.is_member(list_id) and added_by = auth.uid());
create policy "members change items" on wgl.items for update to authenticated using (wgl.is_member(list_id)) with check (wgl.is_member(list_id));
create policy "members delete items" on wgl.items for delete to authenticated using (wgl.is_member(list_id));

grant select, update, delete on wgl.lists to authenticated;
grant select, delete on wgl.list_members to authenticated;
grant select, insert, update, delete on wgl.items to authenticated;

-- ---------- Making a list ----------
-- Creates the list AND adds you as its first member in one step.
create or replace function wgl.create_list(p_name text)
returns wgl.lists language plpgsql security definer set search_path = '' as $$
declare new_list wgl.lists;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into wgl.lists (name, owner_id) values (btrim(p_name), auth.uid()) returning * into new_list;
  insert into wgl.list_members (list_id, user_id) values (new_list.id, auth.uid());
  return new_list;
end $$;
revoke all on function wgl.create_list(text) from public, anon;
grant execute on function wgl.create_list(text) to authenticated;
revoke all on function wgl.is_member(uuid) from public, anon;
grant execute on function wgl.is_member(uuid) to authenticated;

-- Keep updated_at current on lists (touch_updated_at was made in part 2).
drop trigger if exists lists_touch on wgl.lists;
create trigger lists_touch before update on wgl.lists for each row execute function wgl.touch_updated_at();

-- Stamp done_at when an item is crossed off, clear it when un-crossed.
create or replace function wgl.stamp_done()
returns trigger language plpgsql as $$
begin
  if new.done and not coalesce(old.done, false) then new.done_at = now(); end if;
  if not new.done then new.done_at = null; end if;
  return new;
end $$;
drop trigger if exists items_stamp_done on wgl.items;
create trigger items_stamp_done before insert or update of done on wgl.items for each row execute function wgl.stamp_done();
