-- The admin property form only requires a full address (per spec), not a
-- separate postal code — Kosovo addresses don't reliably have one worth
-- forcing an admin to type. City/state stay required (site navigation
-- depends on them structurally), zip becomes optional.
alter table listings alter column zip drop not null;
alter table listings alter column zip set default '';
