-- Supports two things added for the listing detail page:
--
-- 1. nearest_comps(): backs the comps-based AVM (average $/sqft of the N
--    nearest same-property-type listings within a radius, scaled by this
--    listing's sqft). Uses the location GIST index via ST_DWithin.
--
-- 2. tour_requests goes from "must be a logged-in user" to "can be an
--    anonymous visitor" — auth doesn't exist yet (M5), but the listing page
--    needs a working "Request a Tour" form now. user_id stays for when a
--    signed-in user requests a tour; name/email/phone cover the anonymous
--    case, mirroring how `leads` already works.

create or replace function nearest_comps(
  p_listing_id uuid,
  p_max_miles double precision default 10,
  p_limit integer default 5
)
returns table (
  id uuid,
  price numeric,
  sqft integer,
  distance_miles double precision
)
language sql stable as $$
  select
    c.id,
    c.price,
    c.sqft,
    st_distance(l.location, c.location) / 1609.344 as distance_miles
  from listings l
  join listings c on c.id <> l.id
  where l.id = p_listing_id
    and c.property_type = l.property_type
    and c.sqft is not null
    and c.sqft > 0
    and c.price is not null
    and st_dwithin(l.location, c.location, p_max_miles * 1609.344)
  order by st_distance(l.location, c.location) asc
  limit p_limit;
$$;

grant execute on function nearest_comps to anon, authenticated;

alter table tour_requests
  add column name text,
  add column email text,
  add column phone text,
  alter column user_id drop not null;

create policy "anyone can request a tour" on tour_requests
  for insert with check (true);
