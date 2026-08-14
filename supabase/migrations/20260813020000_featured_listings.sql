-- Backs the homepage's "hot homes" section. Same return shape as
-- search_listings_bbox/polygon so the client can reuse SearchListing and
-- ListingCard as-is — no bounds needed since this isn't a map query.

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
    l.hoa_fee, l.days_on_market, l.is_hot_home, l.created_at,
    (
      select li.url from listing_images li
      where li.listing_id = l.id
      order by li.is_floor_plan asc, li.is_3d_tour asc, li.sort_order asc
      limit 1
    ) as primary_image_url
  from listings l
  where l.status <> 'sold'
  order by l.is_hot_home desc, l.created_at desc
  limit p_limit;
$$;

grant execute on function featured_listings to anon, authenticated;
