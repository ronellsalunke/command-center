import { Hono } from "hono";
import { jsonError, readJson, type AppEnvironment } from "../auth/middleware";
import { createProjectField, deleteProjectField, updateProjectField } from "../db/fields";
import { parseProjectId, validateFieldCreate, validateFieldPatch } from "../validation";

export const fieldRoutes = new Hono<AppEnvironment>();

fieldRoutes.post("/:id/fields", async (c) => {
  const projectId = parseProjectId(c.req.param("id"));
  if (!projectId) return jsonError(c, "Project not found.", 404);
  const parsedBody = await readJson(c);
  if (!parsedBody.ok) return parsedBody.response;
  const input = validateFieldCreate(parsedBody.value);
  if (!input.ok) return jsonError(c, input.error, 400);
  try {
    const result = await createProjectField(c.env.DB, projectId, input.value);
    if (result.status === "created") return c.json({ field: result.field }, 201);
    if (result.status === "project-not-found") return jsonError(c, "Project not found.", 404);
    return jsonError(c, "Field limit reached.", 409);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) return jsonError(c, "Field key already exists.", 409);
    throw error;
  }
});

fieldRoutes.patch("/:id/fields/:fieldId", async (c) => {
  const projectId = parseProjectId(c.req.param("id"));
  const fieldId = parseProjectId(c.req.param("fieldId"));
  if (!projectId || !fieldId) return jsonError(c, "Field not found.", 404);
  const parsedBody = await readJson(c);
  if (!parsedBody.ok) return parsedBody.response;
  const input = validateFieldPatch(parsedBody.value);
  if (!input.ok) return jsonError(c, input.error, 400);
  try {
    const result = await updateProjectField(c.env.DB, projectId, fieldId, input.value);
    if (result.status === "updated") return c.json({ field: result.field, swapped_field: result.swappedField });
    if (result.status === "field-not-found") return jsonError(c, "Field not found.", 404);
    return jsonError(c, "Swap target not found.", 404);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) return jsonError(c, "Field key already exists.", 409);
    throw error;
  }
});

fieldRoutes.delete("/:id/fields/:fieldId", async (c) => {
  const projectId = parseProjectId(c.req.param("id"));
  const fieldId = parseProjectId(c.req.param("fieldId"));
  if (!projectId || !fieldId) return jsonError(c, "Field not found.", 404);
  if (!(await deleteProjectField(c.env.DB, projectId, fieldId))) return jsonError(c, "Field not found.", 404);
  return c.json({ ok: true });
});
