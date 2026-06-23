# Lespal

Private lesson tracker shared by one guitar student and one teacher. Lespal has
two intentionally small surfaces: lesson notes and the song library.

## Stack

- React 19 and Vite
- Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, and Realtime
- GitHub Pages deployment

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm test
npm run lint
npm run build
```

## Data ownership

Lespal has one permanent shared library. Both existing accounts read and write
the same rows; there are no student/teacher roles, invites, or relationship
records. The library identifier is in `src/lib/sharedWorkspace.js`, while
`supabase-shared-workspace.sql` restricts access to the two member account IDs.
RLS remains the security boundary.

Fresh database setup uses:

1. `supabase-setup.sql`
2. `supabase-shared-workspace.sql`
3. `supabase-realtime.sql`

For an existing deployment, run the one-time cleanup in
`supabase-remove-obsolete.sql`, then apply `supabase-shared-workspace.sql`.

Disable public user registration in Supabase Auth. Both Lespal accounts should
be provisioned by an administrator.

## Historical CSV migration

`scripts/migrate-data.js` imports the legacy CSV exports. It requires temporary
shell environment variables and never stores an admin key in source code:

```bash
SUPABASE_SERVICE_ROLE_KEY="..." \
LESPAL_USER_ID="..." \
node scripts/migrate-data.js
```

Service-role credentials must never use a `VITE_` prefix or enter the browser
bundle.

## Deployment

```bash
npm run deploy
```

This builds the app and publishes `dist/` to the `gh-pages` branch. Generated
`dist` output is intentionally ignored on the source branch.

The app is currently served from GitHub Pages at
`https://asundiev.github.io/lespal/`. The Supabase database can still be routed
through the separate VPS proxy at
`https://lespal-db.asundiev.com/supabase`. The GitHub Actions deployment bakes
that URL into the app with `VITE_SUPABASE_PROXY_URL`. If it is not set, the app
falls back to the existing dynamic proxy hostnames and then the direct Supabase
URL.
