-- Adds a "storage room in garage" listing attribute and wires it up as an
-- actual /search filter (the quiz's "garage-storage" must-have amenity was
-- previously collected but never applied to any real filter — see
-- translateAnswersToFilters). Default false/no-filter mirrors the existing
-- p_hoa_allowed style: false means "don't restrict", true means "require
-- listings that have it".

alter table listings add column has_garage_storage boolean not null default false;

-- create or replace can't change a function's parameter list (p_garage_storage
-- is inserted before the trailing params, not appended) — it would silently
-- create a second overload instead of replacing, leaving "function name is
-- not unique" errors on the unqualified grant statements below. Drop the old
-- signatures explicitly first.
drop function if exists search_listings_bbox(
  double precision, double precision, double precision, double precision,
  numeric, numeric, smallint, numeric, property_type[], integer, integer,
  smallint, smallint, boolean, text, integer, text, text
);
drop function if exists search_listings_polygon(
  text, numeric, numeric, smallint, numeric, property_type[], integer,
  integer, smallint, smallint, boolean, text, integer, text, text
);

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
  p_garage_storage boolean default false,
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
    and (not p_garage_storage or l.has_garage_storage)
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
  p_garage_storage boolean default false,
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
    and (not p_garage_storage or l.has_garage_storage)
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

grant execute on function search_listings_bbox to anon, authenticated;
grant execute on function search_listings_polygon to anon, authenticated;
