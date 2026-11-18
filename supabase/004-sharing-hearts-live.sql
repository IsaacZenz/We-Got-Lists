-- We Got Lists: database setup, part 4 (Milestones 4–6: sharing, hearts, live updates).
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- Everything stays inside the "wgl" schema; Coconut-Water's tables are not touched.

-- ================= SHARING =================

-- Invite links. Anyone holding a code can join that list until it expires.
create table if not exists wgl.invites (
  code        text primary key,
  list_id     uuid not null references wgl.lists (id) on delete cascade,
  created_by  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '14 days'
);
alter table wgl.invites enable row level security;
-- No direct table access: invites are only made and used through the functions below.

-- Do I share at least one list with this person? (They count as a "friend".)
create or replace function wgl.shares_list_with(p_other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from wgl.list_members a join wgl.list_members b on a.list_id = b.list_id
    where a.user_id = auth.uid() and b.user_id = p_other)
$$;

-- You can now also see the names/initials of people you share a list with.
drop policy if exists "read own profile" on wgl.profiles;
drop policy if exists "read own and list-mates profiles" on wgl.profiles;
create policy "read own and list-mates profiles" on wgl.profiles
  for select to authenticated using (id = auth.uid() or wgl.shares_list_with(id));

-- Make (or reuse) an invite code for a list you're on.
create or replace function wgl.create_invite(p_list uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare c text;
begin
  if not wgl.is_member(p_list) then raise exception 'not on this list'; end if;
  select code into c from wgl.invites
    where list_id = p_list and created_by = auth.uid() and expires_at > now() + interval '7 days'
    order by created_at desc limit 1;
  if c is null then
    c := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    insert into wgl.invites (code, list_id) values (c, p_list);
  end if;
  return c;
end $$;

-- Use an invite code: adds you to the list and returns its id.
create or replace function wgl.join_list(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare l uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select list_id into l from wgl.invites where code = p_code and expires_at > now();
  if l is null then raise exception 'invite not found or expired'; end if;
  insert into wgl.list_members (list_id, user_id) values (l, auth.uid()) on conflict do nothing;
  return l;
end $$;

-- Add a friend (someone you already share a list with) straight onto another of your lists.
create or replace function wgl.add_friend_to_list(p_list uuid, p_friend uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not wgl.is_member(p_list) then raise exception 'not on this list'; end if;
  if not wgl.shares_list_with(p_friend) then raise exception 'not a friend'; end if;
  insert into wgl.list_members (list_id, user_id) values (p_list, p_friend) on conflict do nothing;
end $$;

-- Your friends: everyone who shares any list with you.
create or replace function wgl.my_friends()
returns table (id uuid, display_name text, initials text)
language sql stable security definer set search_path = '' as $$
  select distinct p.id, p.display_name, p.initials
  from wgl.list_members a
  join wgl.list_members b on a.list_id = b.list_id and b.user_id <> a.user_id
  join wgl.profiles p on p.id = b.user_id
  where a.user_id = auth.uid()
  order by p.display_name
$$;

-- Leave a list. If you were the last one on it, the list is deleted.
create or replace function wgl.leave_list(p_list uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from wgl.list_members where list_id = p_list and user_id = auth.uid();
  update wgl.profiles set primary_list_id = null where id = auth.uid() and primary_list_id = p_list;
  if not exists (select 1 from wgl.list_members where list_id = p_list) then
    delete from wgl.lists where id = p_list;
  end if;
end $$;

revoke all on function wgl.shares_list_with(uuid), wgl.create_invite(uuid), wgl.join_list(text),
  wgl.add_friend_to_list(uuid, uuid), wgl.my_friends(), wgl.leave_list(uuid) from public, anon;
grant execute on function wgl.shares_list_with(uuid), wgl.create_invite(uuid), wgl.join_list(text),
  wgl.add_friend_to_list(uuid, uuid), wgl.my_friends(), wgl.leave_list(uuid) to authenticated;

-- ================= HEARTS =================

create table if not exists wgl.item_hearts (
  item_id     uuid not null references wgl.items (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  list_id     uuid not null references wgl.lists (id) on delete cascade, -- copied from the item, for live-update filtering
  created_at  timestamptz not null default now(),
  primary key (item_id, user_id)
);
create index if not exists item_hearts_list_idx on wgl.item_hearts (list_id);
alter table wgl.item_hearts enable row level security;

drop policy if exists "members read hearts" on wgl.item_hearts;
drop policy if exists "heart as yourself"   on wgl.item_hearts;
drop policy if exists "un-heart your own"   on wgl.item_hearts;
create policy "members read hearts" on wgl.item_hearts for select to authenticated using (wgl.is_member(list_id));
create policy "heart as yourself"   on wgl.item_hearts for insert to authenticated
  with check (user_id = auth.uid() and wgl.is_member(list_id)
              and exists (select 1 from wgl.items i where i.id = item_id and i.list_id = item_hearts.list_id));
create policy "un-heart your own"   on wgl.item_hearts for delete to authenticated using (user_id = auth.uid());
grant select, insert, delete on wgl.item_hearts to authenticated;

-- ================= LIVE UPDATES =================
-- Tell Supabase Realtime to broadcast changes to these tables. (Security rules still apply.)
do $$
declare t text;
begin
  foreach t in array array['items', 'item_hearts', 'lists', 'list_members'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'wgl' and tablename = t) then
      execute format('alter publication supabase_realtime add table wgl.%I', t);
    end if;
  end loop;
end $$;
