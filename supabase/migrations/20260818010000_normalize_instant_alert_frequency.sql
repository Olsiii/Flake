-- "Instant" alert frequency is no longer offered in the UI — the search-
-- alerts cron only ever runs once a day (Vercel Hobby plan constraint), so
-- it behaved identically to "daily" and just misled users. Normalize any
-- rows saved before this change; the alert_frequency enum itself keeps the
-- 'instant' value (dropping it would require recreating the type), it's
-- just never written going forward.
update saved_searches set alert_frequency = 'daily' where alert_frequency = 'instant';
