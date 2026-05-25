-- Migration 004: PostgREST role grants
-- Requires migrations 001–003 to be applied first.
--
-- Tables created via SQL migrations are not automatically granted to
-- Supabase's PostgREST roles. This migration fixes that.
-- RLS policies (migration 003) remain the actual security layer —
-- these grants just allow PostgREST to reach the tables at all.

grant all on table accounts             to anon, authenticated, service_role;
grant all on table categories           to anon, authenticated, service_role;
grant all on table transactions         to anon, authenticated, service_role;
grant all on table transfers            to anon, authenticated, service_role;
grant all on table classification_rules to anon, authenticated, service_role;

grant usage on all sequences in schema public to anon, authenticated, service_role;
