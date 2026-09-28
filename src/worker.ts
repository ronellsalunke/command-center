import { Hono } from "hono";
import { apiAuthGuard, jsonError, sessionUsername, type AppEnvironment } from "./auth/middleware";
import { authRoutes } from "./routes/auth";
import { fieldRoutes } from "./routes/fields";
import { projectRoutes } from "./routes/projects";
import { withSecurityHeaders } from "./security/headers";

const app = new Hono<AppEnvironment>();

app.use("/api/*", apiAuthGuard);
app.route("/api", authRoutes);
app.route("/api/projects", projectRoutes);
app.route("/api/projects", fieldRoutes);
app.notFound((c) => jsonError(c, "Not found.", 404));
app.onError((_error, c) => jsonError(c, "Internal server error.", 500));

async function handleRequest(request: Request, env: Env, executionContext: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    return withSecurityHeaders(await app.fetch(request, env, executionContext));
  }

  const protectedPage = url.pathname !== "/login" && !url.pathname.startsWith("/assets/");
  if (protectedPage && !(await sessionUsername(request.headers.get("cookie") ?? undefined, env))) {
    return withSecurityHeaders(Response.redirect(new URL("/login", url), 302));
  }
  return withSecurityHeaders(await env.ASSETS.fetch(request));
}

export default {
  fetch(request, env, executionContext) {
    return handleRequest(request, env, executionContext);
  },
} satisfies ExportedHandler<Env>;
