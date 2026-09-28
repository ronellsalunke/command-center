# API

All `/api/*` routes except login need a valid session cookie.
Mutations use non-GET methods.
Authenticated responses send `Cache-Control: no-store`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/login` | Accepts `{password}`, sets the session cookie. |
| POST | `/api/logout` | Clears the cookie. No server revocation list. |
| GET | `/api/me` | Returns the current username. |
| GET | `/api/projects` | Lists projects, newest first. |
| POST | `/api/projects` | Creates a project from `{name}`. |
| GET | `/api/projects/:id` | Returns one project with fields ordered by position. |
| PATCH | `/api/projects/:id` | Renames a project, bumps `updated_at`. |
| DELETE | `/api/projects/:id` | Deletes a project and its fields in one transaction. |
| POST | `/api/projects/:id/fields` | Adds `{field_key, field_value, position}`. |
| PATCH | `/api/projects/:id/fields/:fieldId` | Updates key, value, or position. |
| DELETE | `/api/projects/:id/fields/:fieldId` | Deletes a field. |

Validation: project names 1–200 chars, keys 1–100 chars, values 1–4096 chars and non-empty.
Field keys are unique per project.
Max 1000 projects, max 100 fields per project.
Only `http:` and `https:` values render as links.
