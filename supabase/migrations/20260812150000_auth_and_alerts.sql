-- Wires Supabase Auth into the app's own `users` table, and adds what the
-- saved-search email digest needs: a per-search "last checked" watermark
-- (not in the original schema — required to avoid re-alerting on the same
-- new listings every cron run) and an RPC for "my saved listings" that
-- returns the same shape the /search cards already know how to render.

create function handle_new_auth_user() returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

alter table saved_searches add column last_checked_at timestamptz;

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
    l.hoa_fee, l.days_on_market, l.is_hot_home, l.created_at,
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

grant execute on function my_saved_listings to authenticated;
