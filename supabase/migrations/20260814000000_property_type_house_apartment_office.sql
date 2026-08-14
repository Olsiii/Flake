-- Property type taxonomy moves from US residential categories
-- (single-family/condo/townhouse/multi-family/other) to a simpler
-- House / Apartment / Office / Land set. Postgres enums can't drop or
-- rename-away values that are still referenced by dependent objects
-- without recreating the type (which would mean dropping and recreating
-- every function whose return signature includes `property_type`, across
-- several earlier migrations) — so this just adds the three new values.
-- The old values stay defined but unused: application code (see
-- src/types/listing.ts's PROPERTY_TYPES) only ever writes/reads the new
-- four from here on, and the seed script was rewritten to only generate
-- the new set.
alter type property_type add value if not exists 'house';
alter type property_type add value if not exists 'apartment';
alter type property_type add value if not exists 'office';
-- 'land' already exists in the original enum.
