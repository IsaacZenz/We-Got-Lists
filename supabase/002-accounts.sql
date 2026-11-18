-- We Got Lists: database setup, part 2 (Milestone 2: accounts).
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.
--
-- Sign-in itself (email + password) is Supabase's built-in Auth, shared with Coconut-Water.
-- This adds a We Got Lists profile: the name and initials other people see on shared lists.
-- There is deliberately NO trigger on auth.users: that would also fire for Coconut-Water sign-ups.
-- The app creates your profile the first time you sign in here.

create table if not exists wgl.profiles (
  id            uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(btrim(display_name)) between 1 and 30),
  initials      text not null check (char_length(initials) between 1 and 2),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Row Level Security: the database itself refuses anything these rules don't allow.
alter table wgl.profiles enable row level security;

drop policy if exists "read own profile" on wgl.profiles;
create policy "read own profile" on wgl.profiles
  for select to authenticated using (id = auth.uid());
-- (Milestone 4 adds: you can also read the profiles of people you share a list with.)

drop policy if exists "create own profile" on wgl.profiles;
create policy "create own profile" on wgl.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "update own profile" on wgl.profiles;
create policy "update own profile" on wgl.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

grant select, insert, update on wgl.profiles to authenticated;

-- Keep updated_at current.
create or replace function wgl.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_touch on wgl.profiles;
create trigger profiles_touch before update on wgl.profiles
  for each row execute function wgl.touch_updated_at();
