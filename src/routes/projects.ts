import { Hono } from "hono";
import { jsonError, readJson, type AppEnvironment } from "../auth/middleware";
import { createProject, deleteProject, getProject, listProjects, updateProject } from "../db/projects";
import { listProjectFields } from "../db/fields";
import { parseProjectId, validateProjectInput } from "../validation";

export const projectRoutes = new Hono<AppEnvironment>();

projectRoutes.get("/", async (c) => c.json({ projects: await listProjects(c.env.DB) }));

projectRoutes.post("/", async (c) => {
  const parsedBody = await readJson(c);
  if (!parsedBody.ok) return parsedBody.response;
  const input = validateProjectInput(parsedBody.value);
  if (!input.ok) return jsonError(c, input.error, 400);
  const project = await createProject(c.env.DB, input.value.name);
  if (!project) return jsonError(c, "Project limit reached.", 409);
  return c.json({ project }, 201);
});

projectRoutes.get("/:id", async (c) => {
  const id = parseProjectId(c.req.param("id"));
  if (!id) return jsonError(c, "Project not found.", 404);
  const project = await getProject(c.env.DB, id);
  if (!project) return jsonError(c, "Project not found.", 404);
  const fields = await listProjectFields(c.env.DB, id);
  return c.json({ project: { ...project, fields } });
});

projectRoutes.patch("/:id", async (c) => {
  const id = parseProjectId(c.req.param("id"));
  if (!id) return jsonError(c, "Project not found.", 404);
  const parsedBody = await readJson(c);
  if (!parsedBody.ok) return parsedBody.response;
  const input = validateProjectInput(parsedBody.value);
  if (!input.ok) return jsonError(c, input.error, 400);
  const project = await updateProject(c.env.DB, id, input.value.name);
  if (!project) return jsonError(c, "Project not found.", 404);
  return c.json({ project });
});

projectRoutes.delete("/:id", async (c) => {
  const id = parseProjectId(c.req.param("id"));
  if (!id) return jsonError(c, "Project not found.", 404);
  if (!(await deleteProject(c.env.DB, id))) return jsonError(c, "Project not found.", 404);
  return c.json({ ok: true });
});
