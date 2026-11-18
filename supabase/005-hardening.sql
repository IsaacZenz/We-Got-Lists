-- We Got Lists: database setup, part 5. Small security tidy-up from Supabase's security advisor.
-- Already applied to the live project on 2026-11-18 (via the Supabase connector). Safe to run again.
-- Pins the search_path of helper functions so they can't be tricked into using lookalike objects.
alter function wgl.ping() set search_path = '';
alter function wgl.touch_updated_at() set search_path = '';
alter function wgl.stamp_done() set search_path = '';
