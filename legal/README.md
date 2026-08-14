Drop the following files here — each is rendered as-is (markdown → HTML) at its matching route:

- `flake-real-estate-terms-of-use.md` → `/terms`
- `flake-real-estate-privacy-policy.md` → `/privacy`
- `flake-real-estate-cookie-policy.md` → `/cookie-policy`

Until a file exists, its page shows a placeholder instead of a broken page. See `src/lib/legal-doc.ts` and `src/components/legal-page.tsx`.
