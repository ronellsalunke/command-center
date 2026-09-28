import { LIMITS } from "../config";
import type { FieldInput } from "../validation";

export type ProjectField = {
  id: number;
  project_id: number;
  field_key: string;
  field_value: string;
  position: number;
  created_at: string;
  updated_at: string;
};

const NOW_SQL = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const FIELD_COLUMNS = "id, project_id, field_key, field_value, position, created_at, updated_at";

export async function listProjectFields(db: D1Database, projectId: number): Promise<ProjectField[]> {
  const result = await db.prepare(
    `SELECT ${FIELD_COLUMNS} FROM project_fields WHERE project_id = ? ORDER BY position, id`,
  )
    .bind(projectId)
    .all<ProjectField>();
  return result.results;
}

export async function createProjectField(
  db: D1Database,
  projectId: number,
  input: FieldInput,
): Promise<{ status: "created"; field: ProjectField } | { status: "project-not-found" | "limit-reached" }> {
  const project = await db.prepare(
    "SELECT p.id, COUNT(f.id) AS field_count FROM projects p LEFT JOIN project_fields f ON f.project_id = p.id WHERE p.id = ? GROUP BY p.id",
  )
    .bind(projectId)
    .first<{ id: number; field_count: number }>();
  if (!project) return { status: "project-not-found" };
  if (project.field_count >= LIMITS.fieldsPerProject) return { status: "limit-reached" };

  const [insertResult] = await db.batch<ProjectField>([
    db.prepare(
      `INSERT INTO project_fields (project_id, field_key, field_value, position) SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM project_fields WHERE project_id = ?) < ? RETURNING ${FIELD_COLUMNS}`,
    ).bind(projectId, input.field_key, input.field_value, input.position, projectId, LIMITS.fieldsPerProject),
    db.prepare(`UPDATE projects SET updated_at = ${NOW_SQL} WHERE id = ? AND changes() > 0`).bind(projectId),
  ]);
  const field = insertResult.results[0];
  return field ? { status: "created", field } : { status: "limit-reached" };
}

function getProjectField(db: D1Database, projectId: number, fieldId: number): Promise<ProjectField | null> {
  return db.prepare(`SELECT ${FIELD_COLUMNS} FROM project_fields WHERE id = ? AND project_id = ?`)
    .bind(fieldId, projectId)
    .first<ProjectField>();
}

function getField(db: D1Database, fieldId: number): Promise<ProjectField | null> {
  return db.prepare(`SELECT ${FIELD_COLUMNS} FROM project_fields WHERE id = ?`)
    .bind(fieldId)
    .first<ProjectField>();
}

export async function updateProjectField(
  db: D1Database,
  projectId: number,
  fieldId: number,
  input: Partial<FieldInput>,
): Promise<
  | { status: "updated"; field: ProjectField | null; swappedField: ProjectField | null }
  | { status: "field-not-found" | "swap-target-not-found" }
> {
  const existing = await getProjectField(db, projectId, fieldId);
  if (!existing) return { status: "field-not-found" };
  const next = { ...existing, ...input };
  const swapWith = input.swap_with;
  let swapped: ProjectField | null = null;
  if (swapWith !== undefined) {
    swapped = await getProjectField(db, projectId, swapWith);
    if (!swapped || swapped.id === existing.id) return { status: "swap-target-not-found" };
  }

  const statements = [
    db.prepare(
      `UPDATE project_fields SET field_key = ?, field_value = ?, position = ?, updated_at = ${NOW_SQL} WHERE id = ? AND project_id = ?`,
    ).bind(next.field_key, next.field_value, next.position, fieldId, projectId),
  ];
  if (swapped) {
    statements.push(
      db.prepare(`UPDATE project_fields SET position = ?, updated_at = ${NOW_SQL} WHERE id = ? AND project_id = ?`).bind(
        existing.position,
        swapped.id,
        projectId,
      ),
    );
  }
  statements.push(db.prepare(`UPDATE projects SET updated_at = ${NOW_SQL} WHERE id = ?`).bind(projectId));
  await db.batch(statements);

  return {
    status: "updated",
    field: await getField(db, fieldId),
    swappedField: swapped ? await getField(db, swapped.id) : null,
  };
}

export async function deleteProjectField(db: D1Database, projectId: number, fieldId: number): Promise<boolean> {
  const existing = await db.prepare("SELECT id FROM project_fields WHERE id = ? AND project_id = ?")
    .bind(fieldId, projectId)
    .first<{ id: number }>();
  if (!existing) return false;
  await db.batch([
    db.prepare("DELETE FROM project_fields WHERE id = ? AND project_id = ?").bind(fieldId, projectId),
    db.prepare(`UPDATE projects SET updated_at = ${NOW_SQL} WHERE id = ?`).bind(projectId),
  ]);
  return true;
}
