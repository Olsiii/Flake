-- Builds on the collections/collection_items tables and RLS policies from
-- the initial schema (owner-only writes, shared-collection reads) to add:
-- a read helper that returns full listing data per collection item (so
-- /collections/[id] can render cards without a second round trip), an
-- anonymous-safe way to attach a note to a shared collection's item (RLS
-- alone can't scope by column, so the owner-only write policy stays as-is
-- and this function carries its own is_shared check instead), and the quiz
-- responses table backing /get-started.

create or replace function get_collection_listings(p_collection_id uuid)
returns table (
  item_id uuid,
  note text,
  added_by uuid,
  added_at timestamptz,
  listing_id uuid,
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
  primary_image_url text
)
language sql stable as $$
  select
    ci.id as item_id,
    ci.note,
    ci.added_by,
    ci.created_at as added_at,
    l.id as listing_id,
    l.title, l.price, l.status, l.property_type, l.beds, l.baths, l.sqft,
    l.address, l.city, l.state, l.zip,
    st_y(l.location::geometry) as lat,
    st_x(l.location::geometry) as lng,
    (
      select li.url from listing_images li
      where li.listing_id = l.id
      order by li.is_floor_plan asc, li.is_3d_tour asc, li.sort_order asc
      limit 1
    ) as primary_image_url
  from collection_items ci
  join listings l on l.id = ci.listing_id
  where ci.collection_id = p_collection_id
  order by ci.created_at desc;
$$;

-- Not security definer: runs as the calling role, so collection_items' own
-- RLS ("owners manage" / "shared collection items are readable") decides
-- whether any rows come back — a private collection viewed by a non-owner
-- returns zero rows, same as querying the table directly.
grant execute on function get_collection_listings to anon, authenticated;

-- The one write anonymous visitors are allowed: a note on an item in a
-- *shared* collection. Security definer because collection_items' only
-- write policy is owner-only; this function re-checks is_shared itself
-- rather than relying on RLS, and only ever touches the note column.
create or replace function set_collection_item_note(p_item_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_shared boolean;
begin
  select c.is_shared into v_is_shared
  from collection_items ci
  join collections c on c.id = ci.collection_id
  where ci.id = p_item_id;

  if v_is_shared is null then
    raise exception 'Collection item not found';
  end if;

  if not v_is_shared then
    raise exception 'This collection is not shared';
  end if;

  update collection_items set note = p_note where id = p_item_id;
end;
$$;

grant execute on function set_collection_item_note to anon, authenticated;

-- quiz_responses -------------------------------------------------------
-- Backs /get-started. user_id is nullable so anonymous quiz-takers still
-- get redirected to their matches; logged-in answers are kept for future
-- personalization.

create table quiz_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index quiz_responses_user_id_idx on quiz_responses (user_id);

alter table quiz_responses enable row level security;

create policy "anyone can submit a quiz response" on quiz_responses
  for insert with check (user_id is null or auth.uid() = user_id);

create policy "users can view their own quiz responses" on quiz_responses
  for select using (auth.uid() = user_id);
