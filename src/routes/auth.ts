import { Hono } from "hono";
import { clearSessionCookie, sessionCookie } from "../auth/cookies";
import { createSessionToken, timingSafeStringEqual } from "../auth/tokens";
import { jsonError, readJson, type AppEnvironment } from "../auth/middleware";
import { LIMITS } from "../config";
import { validateLoginInput } from "../validation";

export const authRoutes = new Hono<AppEnvironment>();

authRoutes.post("/login", async (c) => {
  const parsedBody = await readJson(c, LIMITS.loginBodyBytes);
  if (!parsedBody.ok) return parsedBody.response;
  const input = validateLoginInput(parsedBody.value);
  if (!input.ok || !(await timingSafeStringEqual(input.ok ? input.value.password : "", c.env.ADMIN_PASSWORD))) {
    return jsonError(c, "Invalid credentials.", 401);
  }
  const token = await createSessionToken("admin", c.env.SESSION_SECRET, c.env.ADMIN_PASSWORD);
  c.header("Set-Cookie", sessionCookie(token));
  c.header("Cache-Control", "no-store");
  return c.json({ username: "admin" });
});

authRoutes.post("/logout", (c) => {
  c.header("Set-Cookie", clearSessionCookie());
  return c.json({ ok: true });
});

authRoutes.get("/me", (c) => c.json({ username: c.get("username") }));
