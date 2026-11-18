-- We Got Lists: database setup, part 1 (Milestone 1).
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
--
-- This project is shared with the Coconut-Water app. Everything for We Got Lists lives in its
-- own schema called "wgl", so nothing here touches Coconut-Water's tables in "public".

create schema if not exists wgl;

-- Let the app (signed-out "anon" and signed-in "authenticated" visitors) see that the schema exists.
-- What they can actually read or change is decided table by table with Row Level Security later.
grant usage on schema wgl to anon, authenticated;

-- A tiny health check the app calls to prove it can reach the wgl schema.
create or replace function wgl.ping()
returns text
language sql
stable
as $$ select 'pong'::text $$;

grant execute on function wgl.ping() to anon, authenticated;
