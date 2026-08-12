-- Core schema for the real-estate app: listings, media, people, and the
-- saved-search/tour/lead flows around them.

create extension if not exists postgis;
create extension if not exists pgcrypto;

create type listing_status as enum ('for-sale', 'pending', 'sold', 'for-rent');
create type property_type as enum ('single-family', 'condo', 'townhouse', 'multi-family', 'land', 'other');
create type user_role as enum ('buyer', 'agent');
create type tour_request_status as enum ('requested', 'confirmed', 'completed', 'cancelled');
create type alert_frequency as enum ('instant', 'daily', 'weekly', 'off');

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- agents ---------------------------------------------------------------

create table agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  photo_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- listings ---------------------------------------------------------------
-- agent_id isn't in the original column list but is added so listings can
-- be assigned to one of the seeded agents.

create table listings (
  id uuid primary key default gen_random_uuid(),
  mls_id text,
  agent_id uuid references agents(id) on delete set null,
  title text not null,
  description text,
  price numeric(12, 2) not null,
  status listing_status not null default 'for-sale',
  property_type property_type not null,
  beds smallint,
  baths numeric(3, 1),
  sqft integer,
  lot_size integer,
  year_built smallint,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  location geography(point, 4326),
  hoa_fee numeric(10, 2),
  days_on_market integer not null default 0,
  is_hot_home boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_location_gix on listings using gist (location);
create index listings_agent_id_idx on listings (agent_id);
create index listings_status_idx on listings (status);

create trigger listings_set_updated_at
  before update on listings
  for each row execute function set_updated_at();

-- listing_images ---------------------------------------------------------

create table listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  is_floor_plan boolean not null default false,
  is_3d_tour boolean not null default false,
  created_at timestamptz not null default now()
);

create index listing_images_listing_id_idx on listing_images (listing_id);

-- users --------------------------------------------------------------------
-- Mirrors auth.users; id is the same uuid issued by Supabase Auth.

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text not null unique,
  role user_role not null default 'buyer',
  created_at timestamptz not null default now()
);

-- neighborhoods ------------------------------------------------------------

create table neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  description text,
  crime_score numeric(4, 1),
  walk_score numeric(4, 1),
  local_insights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- saved_searches -------------------------------------------------------

create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  alert_frequency alert_frequency not null default 'off',
  created_at timestamptz not null default now()
);

create index saved_searches_user_id_idx on saved_searches (user_id);

-- saved_listings -------------------------------------------------------

create table saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create index saved_listings_user_id_idx on saved_listings (user_id);
create index saved_listings_listing_id_idx on saved_listings (listing_id);

-- tour_requests ----------------------------------------------------------

create table tour_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  requested_time timestamptz not null,
  status tour_request_status not null default 'requested',
  created_at timestamptz not null default now()
);

create index tour_requests_user_id_idx on tour_requests (user_id);
create index tour_requests_listing_id_idx on tour_requests (listing_id);

-- leads --------------------------------------------------------------------

create table leads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  message text,
  source text,
  created_at timestamptz not null default now()
);

create index leads_listing_id_idx on leads (listing_id);

-- collections & collection_items ------------------------------------------

create table collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create table collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  added_by uuid references users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  unique (collection_id, listing_id)
);

create index collections_owner_id_idx on collections (owner_id);
create index collection_items_collection_id_idx on collection_items (collection_id);
create index collection_items_listing_id_idx on collection_items (listing_id);

-- valuations -----------------------------------------------------------

create table valuations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  estimated_value numeric(12, 2) not null,
  confidence_range_low numeric(12, 2),
  confidence_range_high numeric(12, 2),
  calculated_at timestamptz not null default now()
);

create index valuations_listing_id_idx on valuations (listing_id);

-- Row level security -------------------------------------------------------
-- Explicitly required: listings/agents/neighborhoods are publicly readable;
-- saved_searches/saved_listings/tour_requests are owner-only read/write.
-- The remaining tables get the minimum policy needed for the app to work
-- from the browser with the anon/authenticated key (writes to listings,
-- agents, neighborhoods, listing_images, and valuations stay service-role
-- only, since no public policy grants them).

alter table listings enable row level security;
alter table agents enable row level security;
alter table neighborhoods enable row level security;
alter table listing_images enable row level security;
alter table valuations enable row level security;
alter table users enable row level security;
alter table saved_searches enable row level security;
alter table saved_listings enable row level security;
alter table tour_requests enable row level security;
alter table leads enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;

create policy "listings are publicly readable" on listings
  for select using (true);

create policy "agents are publicly readable" on agents
  for select using (true);

create policy "neighborhoods are publicly readable" on neighborhoods
  for select using (true);

create policy "listing_images are publicly readable" on listing_images
  for select using (true);

create policy "valuations are publicly readable" on valuations
  for select using (true);

create policy "users can view own profile" on users
  for select using (auth.uid() = id);

create policy "users can update own profile" on users
  for update using (auth.uid() = id);

create policy "users manage own saved searches" on saved_searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own saved listings" on saved_listings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own tour requests" on tour_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Lead-capture forms are typically filled out by anonymous visitors; allow
-- inserts from anyone but leave reads to the service role (agents/back
-- office), since there's no admin role to scope a read policy to yet.
create policy "anyone can submit a lead" on leads
  for insert with check (true);

create policy "owners manage their collections" on collections
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "shared collections are readable" on collections
  for select using (is_shared = true);

create policy "owners manage their collection items" on collection_items
  for all using (
    auth.uid() = (select owner_id from collections where collections.id = collection_id)
  ) with check (
    auth.uid() = (select owner_id from collections where collections.id = collection_id)
  );

create policy "shared collection items are readable" on collection_items
  for select using (
    (select is_shared from collections where collections.id = collection_id) = true
  );
