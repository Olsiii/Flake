-- Supabase's security linter flagged schema_migrations as publicly
-- accessible: it was left with the default `grant all ... to anon,
-- authenticated` and no RLS, so the public anon key could read/edit/delete
-- migration history rows via the REST API. It's created by
-- scripts/migrate.ts with a plain `create table` (that script connects via
-- DATABASE_URL as the table owner, which always bypasses RLS, so locking it
-- down here doesn't affect the migration runner).
--
-- The linter also flags spatial_ref_sys (PostGIS's SRID reference table),
-- but that table is owned by the supabase_admin role — this project's
-- postgres role can't ALTER it (confirmed: not a member of supabase_admin,
-- not superuser), and neither can the Supabase Studio SQL editor, which
-- runs as the same role. This is a known Supabase/PostGIS limitation, not
-- something fixable from migrations; Supabase's own linter docs list it as
-- an accepted false positive for projects using PostGIS.

alter table schema_migrations enable row level security;
revoke insert, update, delete, truncate on schema_migrations from anon, authenticated;
