-- User-submitted listings: logged-in visitors can submit a listing from the
-- dashboard, which lands here as a pending row (not in `listings`, so it's
-- never publicly visible) until an admin reviews and either publishes it
-- (inserts into `listings` via the existing createProperty path) or rejects
-- it. Mirrors the fields on PropertyPayload/listings, minus admin-only
-- concerns (agent, hot-home flag, HOA fee, reference number, highlights).

create type listing_submission_status as enum ('pending', 'approved', 'rejected');

create table listing_submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references users(id) on delete cascade,
  status listing_submission_status not null default 'pending',
  reviewed_at timestamptz,
  review_note text,
  published_listing_id uuid references listings(id) on delete set null,

  title text not null,
  listing_type listing_status not null,
  price numeric(12,2) not null,
  description text,
  property_type property_type,
  beds smallint,
  baths numeric(3,1),
  sqft integer,
  lot_size integer,
  year_built smallint,
  address text not null,
  city text not null,
  country text not null default 'Kosovo',
  state text not null default '',
  neighborhood_name text,
  neighborhood_description text,
  walk_score smallint,
  crime_score smallint,
  lat double precision,
  lng double precision,
  listed_at date,
  created_at timestamptz not null default now()
);

create index listing_submissions_submitter_id_idx on listing_submissions (submitter_id);
create index listing_submissions_status_idx on listing_submissions (status);

create table listing_submission_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references listing_submissions(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  is_video boolean not null default false
);

create index listing_submission_images_submission_id_idx on listing_submission_images (submission_id);

alter table listings add column country text not null default 'Kosovo';

alter table listing_submissions enable row level security;
alter table listing_submission_images enable row level security;

-- Owner can create and read their own submissions. Deliberately no
-- update/delete policy (unlike the "for all" pattern used for
-- saved_searches/tour_requests) — once submitted, only the admin
-- (service-role, which bypasses RLS) should be able to change it, so the
-- review flow can't be tampered with by the submitter after the fact.
create policy "users create own submissions" on listing_submissions
  for insert with check (auth.uid() = submitter_id);

create policy "users view own submissions" on listing_submissions
  for select using (auth.uid() = submitter_id);

create policy "users view own submission images" on listing_submission_images
  for select using (
    exists (
      select 1 from listing_submissions s
      where s.id = submission_id and s.submitter_id = auth.uid()
    )
  );
