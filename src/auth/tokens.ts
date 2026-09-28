import { timingSafeEqual } from "node:crypto";
import { SESSION_TTL_SECONDS } from "../config.ts";

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmac(payload: string, secret: string, credentialSecret: string): Promise<Uint8Array> {
  if (encoder.encode(secret).byteLength < 32) throw new Error("SESSION_SECRET must contain at least 32 bytes.");
  const credentialHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(credentialSecret)));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${payload}.${toBase64Url(credentialHash)}`)));
}

export async function timingSafeStringEqual(provided: string, expected: string): Promise<boolean> {
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return timingSafeEqual(new Uint8Array(providedHash), new Uint8Array(expectedHash));
}

export async function createSessionToken(
  username: string,
  secret: string,
  credentialSecret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const encodedUsername = toBase64Url(encoder.encode(username));
  const payload = `${encodedUsername}.${nowSeconds + SESSION_TTL_SECONDS}`;
  const signature = toBase64Url(await hmac(payload, secret, credentialSecret));
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
  credentialSecret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedUsername, expiresText, providedSignature] = parts;
  if (!/^\d+$/.test(expiresText)) return null;
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires <= nowSeconds) return null;

  const payload = `${encodedUsername}.${expiresText}`;
  const expectedSignature = toBase64Url(await hmac(payload, secret, credentialSecret));
  if (!(await timingSafeStringEqual(providedSignature, expectedSignature))) return null;

  const usernameBytes = fromBase64Url(encodedUsername);
  if (!usernameBytes) return null;
  try {
    const username = new TextDecoder("utf-8", { fatal: true }).decode(usernameBytes);
    return username === "admin" ? username : null;
  } catch {
    return null;
  }
}
