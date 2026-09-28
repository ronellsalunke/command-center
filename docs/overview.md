# Overview

Command Center replaces a Notion doc workflow with a small single-user service.
You store projects.
Each project stores named fields such as a GitHub repo, Figma file, Android package name, or docs link.

## Scope

Single user, one account, no signup or sharing.
No Notion import, no offline support, no KV/R2/Durable Objects in v1.

## Stack

- Cloudflare Workers hosts API and frontend in one Worker.
- Hono serves `/api/*`.
- React serves `/`, `/projects/new`, `/projects/:id`, and `/login` with SPA fallback.
- D1 is the only datastore.

## Pages

- `/login` — password login, 30-day session cookie.
- `/` — searchable project list, `+` opens a new-project draft.
- `/projects/new` — name the project first, fields unlock after save.
- `/projects/:id` — rename, add, edit, reorder, and delete fields.
