-- Backs the new /admin/properties section:
--   * listing_images.is_video — distinguishes video uploads from photos so
--     the admin media grid and public gallery can show a play-icon and the
--     upload-sign route can accept video content types.
--   * listings.listed_at — replaces the static, never-updated
--     days_on_market integer as the source of truth for "how long has this
--     been on the market". days_on_market itself now gets computed from
--     listed_at (falling back to created_at for pre-existing rows) in every
--     RPC that returns it, rather than stored and left to go stale.
--   * listings.sort_order — manual curation order for the admin list page
--     and the home page's "Hot homes right now" shelf. Does NOT drive
--     /search's ordering — that already has its own user-facing sort
--     control (newest/price/days-on-market) with no "custom" option, so a
--     drag-order wouldn't have anywhere to plug in there.

alter table listings add column listed_at date;
update listings set listed_at = created_at::date where listed_at is null;
alter table listings alter column listed_at set not null;
alter table listings alter column listed_at set default current_date;

alter table listings add column sort_order integer not null default 0;
create index listings_sort_order_idx on listings (sort_order);

alter table listing_images add column is_video boolean not null default false;

-- Re-derive days_on_market from listed_at in every RPC that returns it.
-- Signatures are unchanged (create or replace only) except where a prior
-- migration already dropped+recreated to change the arg list — those are
-- reproduced here verbatim with only the days_on_market expression swapped.

create or replace function search_listings_bbox(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_beds smallint default null,
  p_min_baths numeric default null,
  p_property_types property_type[] default null,
  p_min_sqft integer default null,
  p_max_sqft integer default null,
  p_min_year_built smallint default null,
  p_max_year_built smallint default null,
  p_hoa_allowed boolean default true,
  p_sort_by text default 'newest',
  p_limit integer default 300,
  p_city text default null,
  p_keyword text default null
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
  primary_image_url text
)
language sql stable as $$
  select
    l.id, l.title, l.price, l.status, l.property_type, l.beds, l.baths, l.sqft,
    l.address, l.city, l.state, l.zip,
    st_y(l.location::geometry) as lat,
    st_x(l.location::geometry) as lng,
    l.hoa_fee, (current_date - l.listed_at)::integer as days_on_market, l.is_hot_home, l.created_at,
    (
      select li.url from listing_images li
      where li.listing_id = l.id
      order by li.is_floor_plan asc, li.is_3d_tour asc, li.sort_order asc
      limit 1
    ) as primary_image_url
  from listings l
  where l.status <> 'sold'
    and l.location && st_makeenvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
    and (p_min_price is null or l.price >= p_min_price)
    and (p_max_price is null or l.price <= p_max_price)
    and (p_min_beds is null or l.beds >= p_min_beds)
    and (p_min_baths is null or l.baths >= p_min_baths)
    and (p_property_types is null or l.property_type = any(p_property_types))
    and (p_min_sqft is null or l.sqft >= p_min_sqft)
    and (p_max_sqft is null or l.sqft <= p_max_sqft)
    and (p_min_year_built is null or l.year_built >= p_min_year_built)
    and (p_max_year_built is null or l.year_built <= p_max_year_built)
    and (p_hoa_allowed or l.hoa_fee is null)
    and (p_city is null or l.city ilike p_city)
    and (
      p_keyword is null
      or l.title ilike '%' || p_keyword || '%'
      or l.description ilike '%' || p_keyword || '%'
      or l.city ilike '%' || p_keyword || '%'
    )
  order by
    case when p_sort_by = 'price_asc' then l.price end asc nulls last,
    case when p_sort_by = 'price_desc' then l.price end desc nulls last,
    case when p_sort_by = 'dom' then (current_date - l.listed_at)::integer end asc nulls last,
    case when p_sort_by not in ('price_asc', 'price_desc', 'dom') then l.created_at end desc nulls last,
    l.id
  limit p_limit;
$$;

create or replace function search_listings_polygon(
  p_polygon_geojson text,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_beds smallint default null,
  p_min_baths numeric default null,
  p_property_types property_type[] default null,
  p_min_sqft integer default null,
  p_max_sqft integer default null,
  p_min_year_built smallint default null,
  p_max_year_built smallint default null,
  p_hoa_allowed boolean default true,
  p_sort_by text default 'newest',
  p_limit integer default 300,
  p_city text default null,
  p_keyword text default null
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
  primary_image_url text
)
language sql stable as $$
  with polygon as (
    select st_setsrid(st_geomfromgeojson(p_polygon_geojson), 4326) as geom
  )
  select
    l.id, l.title, l.price, l.status, l.property_type, l.beds, l.baths, l.sqft,
    l.address, l.city, l.state, l.zip,
    st_y(l.location::geometry) as lat,
    st_x(l.location::geometry) as lng,
    l.hoa_fee, (current_date - l.listed_at)::integer as days_on_market, l.is_hot_home, l.created_at,
    (
      select li.url from listing_images li
      where li.listing_id = l.id
      order by li.is_floor_plan asc, li.is_3d_tour asc, li.sort_order asc
      limit 1
    ) as primary_image_url
  from listings l, polygon
  where l.status <> 'sold'
    and l.location && st_envelope(polygon.geom)::geography
    and st_contains(polygon.geom, l.location::geometry)
    and (p_min_price is null or l.price >= p_min_price)
    and (p_max_price is null or l.price <= p_max_price)
    and (p_min_beds is null or l.beds >= p_min_beds)
    and (p_min_baths is null or l.baths >= p_min_baths)
    and (p_property_types is null or l.property_type = any(p_property_types))
    and (p_min_sqft is null or l.sqft >= p_min_sqft)
    and (p_max_sqft is null or l.sqft <= p_max_sqft)
    and (p_min_year_built is null or l.year_built >= p_min_year_built)
    and (p_max_year_built is null or l.year_built <= p_max_year_built)
    and (p_hoa_allowed or l.hoa_fee is null)
    and (p_city is null or l.city ilike p_city)
    and (
      p_keyword is null
      or l.title ilike '%' || p_keyword || '%'
      or l.description ilike '%' || p_keyword || '%'
      or l.city ilike '%' || p_keyword || '%'
    )
  order by
    case when p_sort_by = 'price_asc' then l.price end asc nulls last,
    case when p_sort_by = 'price_desc' then l.price end desc nulls last,
    case when p_sort_by = 'dom' then (current_date - l.listed_at)::integer end asc nulls last,
    case when p_sort_by not in ('price_asc', 'price_desc', 'dom') then l.created_at end desc nulls last,
    l.id
  limit p_limit;
$$;

create or replace function my_saved_listings()
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
  primary_image_url text
)
language sql stable as $$
  select
    l.id, l.title, l.price, l.status, l.property_type, l.beds, l.baths, l.sqft,
    l.address, l.city, l.state, l.zip,
    st_y(l.location::geometry) as lat,
    st_x(l.location::geometry) as lng,
    l.hoa_fee, (current_date - l.listed_at)::integer as days_on_market, l.is_hot_home, l.created_at,
    (
      select li.url from listing_images li
      where li.listing_id = l.id
      order by li.is_floor_plan asc, li.is_3d_tour asc, li.sort_order asc
      limit 1
    ) as primary_image_url
  from saved_listings sl
  join listings l on l.id = sl.listing_id
  where sl.user_id = auth.uid()
  order by sl.created_at desc;
$$;

create or replace function featured_listings(p_limit integer default 6)
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
  primary_image_url text
)
language sql stable as $$
  select
    l.id, l.title, l.price, l.status, l.property_type, l.beds, l.baths, l.sqft,
    l.address, l.city, l.state, l.zip,
    st_y(l.location::geometry) as lat,
    st_x(l.location::geometry) as lng,
    l.hoa_fee, (current_date - l.listed_at)::integer as days_on_market, l.is_hot_home, l.created_at,
    (
      select li.url from listing_images li
      where li.listing_id = l.id
      order by li.is_floor_plan asc, li.is_3d_tour asc, li.sort_order asc
      limit 1
    ) as primary_image_url
  from listings l
  where l.status <> 'sold'
  order by l.is_hot_home desc, l.sort_order asc, l.created_at desc
  limit p_limit;
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
    l.hoa_fee, (current_date - l.listed_at)::integer as days_on_market, l.is_hot_home, l.created_at,
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
    l.hoa_fee, (current_date - l.listed_at)::integer as days_on_market, l.is_hot_home, l.created_at,
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
