# Operations

## Local

`npm install`, `npm run build`, `npx wrangler d1 migrations apply command-center --local`, `npm run dev`.

## Deploy

1. `wrangler secret put ADMIN_PASSWORD` and `wrangler secret put SESSION_SECRET`.
2. `wrangler d1 migrations apply command-center --remote`.
3. Add a WAF rate-limit rule for `POST /api/login`.
4. `wrangler deploy`.

## Recovery

D1 Time Travel is the v1 backup. It is always on.
Restore with `wrangler d1 time-travel restore command-center --timestamp=<unix-ts>`.
Retention is 7 days on Workers Free, 30 days on Paid.
Restore overwrites the database in place and does not cover account compromise.

## Limits

- D1 Free: 5M rows read and 100K rows written per day, 500 MB per database.
- 50 queries per Worker invocation, 100 bound parameters per statement.
- Free-tier exhaustion fails requests until quota resets.
- Two tabs editing the same record: last write wins.
