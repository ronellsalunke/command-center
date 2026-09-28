# Auth

Single `admin` account, stateless sessions, 30-day expiry.

## Secrets

- `ADMIN_PASSWORD` verifies the login with a timing-safe compare.
- `SESSION_SECRET` (32+ random bytes) signs session tokens.
- Never reuse the password as the signing key.

## Tokens

Login issues `base64(username).expires.HMAC(payload, SESSION_SECRET)`.
The cookie is `__Host-session=<token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`.
Each request re-verifies HMAC plus expiry with a timing-safe compare.

## Caveats

- Logout clears the browser cookie only. A copied token stays valid until expiry.
- Rotating either secret logs you out everywhere.
- Login returns a generic error for bad credentials. Rate-limit `POST /api/login` with a WAF rule.
- Bodies are size-limited before comparing, and all queries are parameterized.
