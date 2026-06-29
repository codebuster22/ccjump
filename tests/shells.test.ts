import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultConfig } from "../src/config";
import { isSupportedShell, generateInit, isWired, wireShell, rcPath } from "../src/shells";

test("allowlist", () => {
  expect(isSupportedShell("bash")).toBe(true);
  expect(isSupportedShell("zsh")).toBe(true);
  expect(isSupportedShell("fish")).toBe(false);
});

test("generateInit emits one function per project (hyphen-safe)", () => {
  const c = defaultConfig();
  c.projects["titus-bot"] = { path: "/x/titus-bot" };
  const out = generateInit(c, "zsh");
  expect(out).toContain(`titus-bot () { ccjump run 'titus-bot' "$@"; }`);
});

test("generateInit empty registry is empty string", () => {
  expect(generateInit(defaultConfig(), "bash")).toBe("");
});

let home: string; const saved = process.env.HOME;
beforeEach(() => { home = mkdtempSync(join(tmpdir(), "home-")); process.env.HOME = home; });
afterEach(() => { rmSync(home, { recursive: true, force: true }); if (saved) process.env.HOME = saved; });

test("wireShell appends once and is idempotent", () => {
  const r1 = wireShell("zsh");
  expect(r1.changed).toBe(true);
  expect(existsSync(rcPath("zsh"))).toBe(true);
  const r2 = wireShell("zsh");
  expect(r2.changed).toBe(false);
  const content = readFileSync(rcPath("zsh"), "utf8");
  expect(content.match(/>>> ccjump >>>/g)?.length).toBe(1);
  expect(isWired(content)).toBe(true);
  expect(content).toContain(`eval "$(ccjump init zsh)"`);
});
