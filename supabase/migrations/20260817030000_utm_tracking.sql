-- Lets leads/tour requests be attributed by acquisition channel — captured
-- client-side from the listing page's URL at submit time (see
-- src/components/contact-agent-form.tsx's useUtmParams).

alter table leads
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_term text,
  add column utm_content text;

alter table tour_requests
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_term text,
  add column utm_content text;
