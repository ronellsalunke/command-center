import { LIMITS } from "../config";

export type Project = { id: number; name: string; created_at: string; updated_at: string };

const NOW_SQL = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export async function listProjects(db: D1Database): Promise<Project[]> {
  const result = await db.prepare(
    "SELECT id, name, created_at, updated_at FROM projects ORDER BY updated_at DESC, id DESC",
  ).all<Project>();
  return result.results;
}

export function createProject(db: D1Database, name: string): Promise<Project | null> {
  return db.prepare(
    "INSERT INTO projects (name) SELECT ? WHERE (SELECT COUNT(*) FROM projects) < ? RETURNING id, name, created_at, updated_at",
  )
    .bind(name, LIMITS.projects)
    .first<Project>();
}

export function getProject(db: D1Database, id: number): Promise<Project | null> {
  return db.prepare("SELECT id, name, created_at, updated_at FROM projects WHERE id = ?")
    .bind(id)
    .first<Project>();
}

export function updateProject(db: D1Database, id: number, name: string): Promise<Project | null> {
  return db.prepare(
    `UPDATE projects SET name = ?, updated_at = ${NOW_SQL} WHERE id = ? RETURNING id, name, created_at, updated_at`,
  )
    .bind(name, id)
    .first<Project>();
}

export async function deleteProject(db: D1Database, id: number): Promise<boolean> {
  const [result] = await db.batch([
    db.prepare("DELETE FROM projects WHERE id = ? RETURNING id").bind(id),
  ]);
  return result.results.length > 0;
}
