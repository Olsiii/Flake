-- Albanian translations for free-text listing/neighborhood content that the
-- static i18n dictionary can't cover (it only translates UI chrome, not
-- DB-sourced copy). Nullable: falls back to the English column when a
-- translation hasn't been generated yet (see src/lib/translate.ts).

alter table listings add column description_sq text;

alter table neighborhoods add column description_sq text;
alter table neighborhoods add column local_insights_sq jsonb not null default '[]'::jsonb;
