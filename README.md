# Command Center

Single-user service replacing a Notion doc for tracking project metadata.
Each project holds named fields such as repo links, Figma files, package names, and docs.

One Cloudflare Worker serves the Hono API and the React frontend.
D1 is the only datastore.

## Quickstart

1. Copy `.dev.vars.example` to `.dev.vars` and set `ADMIN_PASSWORD` plus a 32+ byte `SESSION_SECRET`.
2. Run `npm install`.
3. Run `npm run build`.
4. Run `npx wrangler d1 migrations apply command-center --local`.
5. Run `npm run dev` and open `http://localhost:8787/login`.

## Scripts

- `npm run dev` — build frontend, start local Worker.
- `npm run check` — typecheck and production build.
- `npm test` — unit tests.

## Deploy

1. Set secrets: `wrangler secret put ADMIN_PASSWORD` and `wrangler secret put SESSION_SECRET`.
2. Apply migrations: `wrangler d1 migrations apply command-center --remote`.
3. Add a WAF rate-limit rule for `POST /api/login` on the production hostname.
4. Deploy: `wrangler deploy`.

## Docs

- `docs/overview.md` — goal, scope, stack.
- `docs/usage.md` — how to use the UI.
- `docs/api.md` — API routes.
- `docs/data.md` — database schema and limits.
- `docs/auth.md` — login and sessions.
- `docs/operations.md` — deploy, recovery, failure modes.
