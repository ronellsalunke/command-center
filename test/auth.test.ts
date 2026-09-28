import assert from "node:assert/strict";
import test from "node:test";
import { SESSION_TTL_SECONDS } from "../src/config.ts";
import { createSessionToken, verifySessionToken } from "../src/auth/tokens.ts";

test("creates and verifies a session token", async () => {
  const now = 1_700_000_000;
  const token = await createSessionToken("admin", "a-secret-with-at-least-32-random-bytes", "password", now);
  assert.equal(await verifySessionToken(token, "a-secret-with-at-least-32-random-bytes", "password", now), "admin");
  assert.equal(token.split(".")[1], String(now + SESSION_TTL_SECONDS));
});

test("rejects tampered and expired session tokens", async () => {
  const now = 1_700_000_000;
  const token = await createSessionToken("admin", "a-secret-with-at-least-32-random-bytes", "password", now);
  assert.equal(await verifySessionToken(`${token.slice(0, -1)}x`, "a-secret-with-at-least-32-random-bytes", "password", now), null);
  assert.equal(await verifySessionToken(token, "a-secret-with-at-least-32-random-bytes", "password", now + SESSION_TTL_SECONDS), null);
  assert.equal(await verifySessionToken(token, "a-secret-with-at-least-32-random-bytes", "changed-password", now), null);
});
