// tests/registry.test.ts
import { test, expect } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultConfig } from "../src/config";
import { deriveName, isValidName, addProject, removeProject, listProjects } from "../src/registry";

test("isValidName accepts hyphens, rejects junk", () => {
  expect(isValidName("titus-bot")).toBe(true);
  expect(isValidName("my_app.v2")).toBe(true);
  expect(isValidName("bad name")).toBe(false);
  expect(isValidName("with/slash")).toBe(false);
  expect(isValidName("")).toBe(false);
});

test("deriveName is the basename", () => {
  const d = mkdtempSync(join(tmpdir(), "ccj-"));
  expect(deriveName(d)).toBe(d.split("/").pop());
  rmSync(d, { recursive: true, force: true });
});

test("addProject registers, dedupes, errors on collision", () => {
  const d = mkdtempSync(join(tmpdir(), "proj-"));
  const cfg = defaultConfig();
  const r = addProject(cfg, d);
  expect(cfg.projects[r.name].path).toBe(d);
  // same path again = idempotent (no throw)
  expect(() => addProject(cfg, d)).not.toThrow();
  // same name, different path = throw
  const d2 = mkdtempSync(join(tmpdir(), "proj-"));
  expect(() => addProject(cfg, d2, r.name)).toThrow(/already maps/);
  rmSync(d, { recursive: true, force: true }); rmSync(d2, { recursive: true, force: true });
});

test("addProject rejects non-directory", () => {
  expect(() => addProject(defaultConfig(), "/no/such/dir/xyz")).toThrow(/not a directory/);
});

test("remove + list", () => {
  const d = mkdtempSync(join(tmpdir(), "proj-"));
  const cfg = defaultConfig(); const { name } = addProject(cfg, d);
  expect(listProjects(cfg).map((r) => r.name)).toContain(name);
  removeProject(cfg, name);
  expect(listProjects(cfg)).toHaveLength(0);
  expect(() => removeProject(cfg, "ghost")).toThrow(/no project/);
  rmSync(d, { recursive: true, force: true });
});
