import assert from "node:assert/strict";
import test from "node:test";
import { parseProjectId, validateFieldCreate, validateFieldPatch, validateLoginInput, validateProjectInput } from "../src/validation.ts";

test("validates project names and IDs", () => {
  assert.deepEqual(validateProjectInput({ name: "  Example  " }), { ok: true, value: { name: "Example" } });
  assert.equal(validateProjectInput({ name: " " }).ok, false);
  assert.equal(validateProjectInput({ name: "x".repeat(201) }).ok, false);
  assert.equal(validateProjectInput({ name: "😀".repeat(200) }).ok, true);
  assert.equal(parseProjectId("42"), 42);
  assert.equal(parseProjectId("0"), null);
  assert.equal(parseProjectId("1x"), null);
});

test("validates field creation and patch input", () => {
  assert.equal(validateFieldCreate({ field_key: "Repo", field_value: "https://example.com", position: 0 }).ok, true);
  assert.equal(validateFieldCreate({ field_key: "", field_value: "", position: 0 }).ok, false);
  assert.equal(validateFieldCreate({ field_key: "Key", field_value: "Value", position: -1 }).ok, false);
  assert.equal(validateFieldCreate({ field_key: "Key", field_value: "x".repeat(4097), position: 0 }).ok, false);
  assert.equal(validateFieldPatch({}).ok, false);
  assert.deepEqual(validateFieldPatch({ position: 2 }), { ok: true, value: { position: 2 } });
  for (const field_value of ["", " \t\n ", " ".repeat(4097)]) {
    const expected = { ok: false, error: "Field value must not be empty." };
    assert.deepEqual(validateFieldCreate({ field_key: "Key", field_value, position: 0 }), expected);
    assert.deepEqual(validateFieldPatch({ field_value }), expected);
  }
  assert.deepEqual(validateFieldCreate({ field_key: "Key", field_value: " Value ", position: 0 }), {
    ok: true,
    value: { field_key: "Key", field_value: " Value ", position: 0 },
  });
  assert.deepEqual(validateFieldPatch({ field_value: " Value " }), { ok: true, value: { field_value: " Value " } });
});

test("limits login passwords", () => {
  assert.equal(validateLoginInput({ password: "secret" }).ok, true);
  assert.equal(validateLoginInput({ password: "" }).ok, false);
  assert.equal(validateLoginInput({ password: "x".repeat(1025) }).ok, false);
});
