-- Cloudflare R2 needed a card on file that isn't going through, so listing
-- photo storage moves to Supabase Storage instead. Public bucket so listing
-- images are readable via a plain public URL without signing, matching how
-- R2 objects were served from R2_PUBLIC_URL.

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;
