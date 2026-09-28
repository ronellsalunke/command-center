import type { Context, Next } from "hono";
import { readSessionCookie } from "./cookies";
import { verifySessionToken } from "./tokens";
import { LIMITS } from "../config";

export type AppEnvironment = { Bindings: Env; Variables: { username: string } };
export type AppContext = Context<AppEnvironment>;

export function jsonError(c: AppContext, error: string, status: 400 | 401 | 403 | 404 | 409 | 413 | 500) {
  return c.json({ error }, status);
}

export async function readJson(
  c: AppContext,
  limit = LIMITS.bodyBytes,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const declaredLength = Number(c.req.header("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > limit) {
    return { ok: false, response: jsonError(c, "Request body is too large.", 413) };
  }
  const reader = c.req.raw.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return { ok: false, response: jsonError(c, "Request body is too large.", 413) };
      }
      chunks.push(value);
    }
  }
  try {
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(body) };
  } catch {
    return { ok: false, response: jsonError(c, "Invalid JSON.", 400) };
  }
}

export function sameOrigin(c: AppContext): boolean {
  const origin = c.req.header("origin");
  return origin !== undefined && origin === new URL(c.req.url).origin;
}

export async function sessionUsername(cookieHeader: string | undefined, env: Env): Promise<string | null> {
  const token = readSessionCookie(cookieHeader);
  return token ? verifySessionToken(token, env.SESSION_SECRET, env.ADMIN_PASSWORD) : null;
}

export async function apiAuthGuard(c: AppContext, next: Next) {
  if (c.req.path !== "/api/login") c.header("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method) && !sameOrigin(c)) {
    return jsonError(c, "Forbidden.", 403);
  }
  if (c.req.path !== "/api/login") {
    const username = await sessionUsername(c.req.header("cookie"), c.env);
    if (!username) return jsonError(c, "Unauthorized.", 401);
    c.set("username", username);
  }
  await next();
}
