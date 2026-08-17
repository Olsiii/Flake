-- PostgREST/supabase-js has no way to write a geography(point) column from
-- plain lat/lng through .update() — needed by the admin property form's
-- "Look up coordinates" flow (src/lib/admin/properties.ts).
create or replace function set_listing_location(
  p_listing_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns void
language sql as $$
  update listings
  set location = st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
  where id = p_listing_id;
$$;

-- Same round-trip problem in reverse: reading a geography(point) back out
-- through PostgREST doesn't give usable lat/lng, so the admin edit form
-- (src/lib/admin/properties.ts's getPropertyForEdit) calls this instead.
create or replace function listing_lat_lng(p_listing_id uuid)
returns table (lat double precision, lng double precision)
language sql stable as $$
  select st_y(location::geometry), st_x(location::geometry)
  from listings
  where id = p_listing_id and location is not null;
$$;
