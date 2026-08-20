-- Backs a "Similar listings" section on the listing detail page. Prioritizes
-- same-neighborhood matches, then same-city, ordered by price closeness to
-- the source listing — a simple stand-in for real recommendation logic that
-- still gives every listing page *some* relevant matches rather than none.

create or replace function similar_listings(
  p_listing_id uuid,
  p_limit integer default 4
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
  with src as (
    select id, neighborhood_id, city, price
    from listings
    where id = p_listing_id
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
  from listings l, src
  where l.id <> src.id
    and l.status <> 'sold'
    and (
      (src.neighborhood_id is not null and l.neighborhood_id = src.neighborhood_id)
      or l.city = src.city
    )
  order by
    (src.neighborhood_id is not null and l.neighborhood_id = src.neighborhood_id) desc,
    abs(l.price - src.price) asc,
    l.id
  limit p_limit;
$$;

grant execute on function similar_listings to anon, authenticated;
