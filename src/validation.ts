type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function validTrimmedText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && unicodeLength(value.trim()) >= 1 && unicodeLength(value.trim()) <= maxLength;
}

function unicodeLength(value: string): number {
  return Array.from(value).length;
}

export function parseProjectId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function validateProjectInput(value: unknown): ValidationResult<{ name: string }> {
  if (!isRecord(value) || !hasOnlyKeys(value, ["name"]) || !validTrimmedText(value.name, 200)) {
    return { ok: false, error: "Name must contain 1 to 200 characters." };
  }
  return { ok: true, value: { name: value.name.trim() } };
}

function validPosition(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export type FieldInput = { field_key: string; field_value: string; position: number; swap_with?: number };

export function validateFieldCreate(value: unknown): ValidationResult<FieldInput> {
  if (!isRecord(value) || !hasOnlyKeys(value, ["field_key", "field_value", "position"])) {
    return { ok: false, error: "Invalid field." };
  }
  if (!validTrimmedText(value.field_key, 100)) {
    return { ok: false, error: "Field key must contain 1 to 100 characters." };
  }
  if (typeof value.field_value === "string" && !value.field_value.trim()) {
    return { ok: false, error: "Field value must not be empty." };
  }
  if (typeof value.field_value !== "string" || unicodeLength(value.field_value) > 4096) {
    return { ok: false, error: "Field value must not exceed 4096 characters." };
  }
  if (!validPosition(value.position)) {
    return { ok: false, error: "Position must be a non-negative integer." };
  }
  return {
    ok: true,
    value: { field_key: value.field_key.trim(), field_value: value.field_value, position: value.position },
  };
}

export function validateFieldPatch(value: unknown): ValidationResult<Partial<FieldInput>> {
  if (!isRecord(value) || !hasOnlyKeys(value, ["field_key", "field_value", "position", "swap_with"]) || Object.keys(value).length === 0) {
    return { ok: false, error: "Provide at least one field property." };
  }
  const result: Partial<FieldInput> = {};
  if ("field_key" in value) {
    if (!validTrimmedText(value.field_key, 100)) {
      return { ok: false, error: "Field key must contain 1 to 100 characters." };
    }
    result.field_key = value.field_key.trim();
  }
  if ("field_value" in value) {
    if (typeof value.field_value === "string" && !value.field_value.trim()) {
      return { ok: false, error: "Field value must not be empty." };
    }
    if (typeof value.field_value !== "string" || unicodeLength(value.field_value) > 4096) {
      return { ok: false, error: "Field value must not exceed 4096 characters." };
    }
    result.field_value = value.field_value;
  }
  if ("position" in value) {
    if (!validPosition(value.position)) {
      return { ok: false, error: "Position must be a non-negative integer." };
    }
    result.position = value.position;
  }
  if ("swap_with" in value) {
    if (!validPosition(value.swap_with) || value.swap_with === 0 || !("position" in result)) {
      return { ok: false, error: "Swap target must be a positive field ID with a position." };
    }
    result.swap_with = value.swap_with;
  }
  return { ok: true, value: result };
}

export function validateLoginInput(value: unknown): ValidationResult<{ password: string }> {
  if (!isRecord(value) || !hasOnlyKeys(value, ["password"]) || typeof value.password !== "string") {
    return { ok: false, error: "Invalid credentials." };
  }
  if (value.password.length < 1 || value.password.length > 1024) {
    return { ok: false, error: "Invalid credentials." };
  }
  return { ok: true, value: { password: value.password } };
}
