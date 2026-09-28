# Data

D1 holds two tables. No auth tables in v1.

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE project_fields (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL CHECK (length(trim(field_key)) BETWEEN 1 AND 100),
  field_value TEXT NOT NULL CHECK (length(field_value) <= 4096),
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (project_id, field_key)
);
CREATE INDEX idx_fields_order ON project_fields(project_id, position, id);
CREATE INDEX idx_projects_recent ON projects(updated_at DESC, id DESC);
```

Notes:

- Deleting a project cascades to its fields. This cannot be undone from the UI.
- Field mutations also bump `projects.updated_at` in the same D1 batch.
- Empty or whitespace-only values are rejected in validation on top of the schema.
- Migrations live in `migrations/`. Apply locally with `--local`, in production with `--remote`.
