-- Adds neighborhood_id as a real FK on listings (previously matched to a
-- neighborhood at query time by city+state, per the comment that used to
-- live in src/app/listing/[id]/data.ts) plus a unique slug on
-- neighborhoods, so /cities/[city] and /neighborhoods/[city]/[slug] have
-- stable routes and listings can be looked up by neighborhood directly
-- instead of by city/state string match.

alter table neighborhoods add column slug text;

-- Same algorithm as src/lib/slug.ts's slugify() — keep in sync.
update neighborhoods
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'));

alter table neighborhoods alter column slug set not null;
alter table neighborhoods add constraint neighborhoods_slug_key unique (slug);
create index neighborhoods_city_state_idx on neighborhoods (city, state);

alter table listings add column neighborhood_id uuid references neighborhoods(id) on delete set null;

update listings l
set neighborhood_id = n.id
from neighborhoods n
where l.city = n.city
  and l.state = n.state;

create index listings_neighborhood_id_idx on listings (neighborhood_id);

-- list_cities / listings_by_city / listings_by_neighborhood back the new
-- /cities/[city] and /neighborhoods/[city]/[slug] pages (city-slug
-- resolution, sitemap generation, and paginated listing grids). Same row
-- shape and sold-exclusion convention as search_listings_bbox/polygon so
-- the client can reuse SearchListing/ListingCard; total_count rides along
-- via a window function so callers get pagination info in one query.

create or replace function list_cities()
returns table (
  city text,
  state text,
  listing_count bigint
)
language sql stable as $$
  select city, state, count(*) as listing_count
  from listings
  where status <> 'sold'
  group by city, state
  order by city;
$$;

create or replace function listings_by_city(
  p_city text,
  p_state text,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  price numeric,
  status listing_status,
  property_type property_type,
  beds smallint,
  baths numeric,
  sqft integer,
  address text,
  city text,
  state text,
  zip text,
  lat double precision,
  lng double precision,
  hoa_fee numeric,
  days_on_market integer,
  is_hot_home boolean,
  created_at timestamptz,
  primary_image_url text,
  total_count bigint
)
language sql stable as $$
  select
    l.id, l.title, l.price, l.status, l.property_type, l.beds, l.baths, l.sqft,
    l.address, l.city, l.state, l.zip,
    st_y(l.location::geometry) as lat,
    st_x(l.location::geometry) as lng,
    l.hoa_fee, l.days_on_market, l.is_hot_home, l.created_at,
    (
      select li.url from listing_images li
      where li.listing_id = l.id
      order by li.is_floor_plan asc, li.is_3d_tour asc, li.sort_order asc
      limit 1
    ) as primary_image_url,
    count(*) over() as total_count
  from listings l
  where l.status <> 'sold'
    and l.city = p_city
    and l.state = p_state
  order by l.created_at desc
  limit p_limit offset p_offset;
$$;

create or replace function listings_by_neighborhood(
  p_neighborhood_id uuid,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  price numeric,
  status listing_status,
  property_type property_type,
  beds smallint,
  baths numeric,
  sqft integer,
  address text,
  city text,
  state text,
  zip text,
  lat double precision,
  lng double precision,
  hoa_fee numeric,
  days_on_market integer,
  is_hot_home boolean,
  created_at timestamptz,
  primary_image_url text,
  total_count bigint
)
language sql stable as $$
  select
    l.id, l.title, l.price, l.status, l.property_type, l.beds, l.baths, l.sqft,
    l.address, l.city, l.state, l.zip,
    st_y(l.location::geometry) as lat,
    st_x(l.location::geometry) as lng,
    l.hoa_fee, l.days_on_market, l.is_hot_home, l.created_at,
    (
      select li.url from listing_images li
      where li.listing_id = l.id
      order by li.is_floor_plan asc, li.is_3d_tour asc, li.sort_order asc
      limit 1
    ) as primary_image_url,
    count(*) over() as total_count
  from listings l
  where l.status <> 'sold'
    and l.neighborhood_id = p_neighborhood_id
  order by l.created_at desc
  limit p_limit offset p_offset;
$$;

grant execute on function list_cities to anon, authenticated;
grant execute on function listings_by_city to anon, authenticated;
grant execute on function listings_by_neighborhood to anon, authenticated;
