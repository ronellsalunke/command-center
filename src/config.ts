export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_COOKIE = "__Host-session";

export const LIMITS = {
  bodyBytes: 20 * 1024,
  loginBodyBytes: 8 * 1024,
  projects: 1000,
  fieldsPerProject: 100,
} as const;
