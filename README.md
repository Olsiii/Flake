# Flake

A real estate listings app built with Next.js (App Router), Supabase (Postgres + Auth + Storage), Mapbox, Resend, and the Anthropic API for natural-language search.

## Before you write any code

This repo pins a Next.js version with breaking API/convention changes from what most models were trained on. Read `AGENTS.md` first — it points at the version-specific docs under `node_modules/next/dist/docs/`.

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in the values — each var is documented inline (Supabase project keys, Mapbox token, Resend API key, Anthropic key, admin password, etc.). Most features degrade gracefully when a given key is missing (e.g. AI search falls back to keyword matching without `ANTHROPIC_API_KEY`), but Supabase vars are required for the app to run at all.

3. Apply database migrations (requires `DATABASE_URL` from the Supabase dashboard):

   ```bash
   pnpm db:migrate
   ```

4. (Optional) Seed demo data:

   ```bash
   pnpm seed
   ```

5. Run the dev server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start` — Next.js dev, build, and prod server
- `pnpm lint` / `pnpm typecheck` — ESLint and `tsc --noEmit`
- `pnpm test` — Vitest
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm db:migrate` — apply `supabase/migrations/*.sql` via `scripts/migrate.ts` (no Supabase CLI needed)
- `pnpm seed` — populate demo listings/agents via `scripts/seed.ts`
- `pnpm backfill-translations` — one-off batch job to backfill AI-translated content (see `src/lib/translate.ts`)

## Project layout

- `src/app` — routes, pages, and API handlers (App Router)
- `src/components` — shared UI components
- `src/lib` — server-side utilities (Supabase clients, auth, email, rate limiting, i18n helpers)
- `src/i18n` — static UI-string dictionaries (en/sq)
- `src/types` — shared TypeScript types
- `supabase/migrations` — SQL migrations, applied in order by `scripts/migrate.ts`
- `legal` — source markdown for the privacy policy, terms, and cookie policy pages

## Admin

`/admin` is gated by a single shared password (`ADMIN_PASSWORD`) rather than per-user accounts — see `src/lib/admin-auth.ts` for the rationale.
