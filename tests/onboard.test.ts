import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectShells, nonInteractiveSetup } from "../src/onboard";

let home: string, xdg: string; const sH = process.env.HOME, sX = process.env.XDG_CONFIG_HOME;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "home-")); xdg = mkdtempSync(join(tmpdir(), "xdg-"));
  process.env.HOME = home; process.env.XDG_CONFIG_HOME = xdg;
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true }); rmSync(xdg, { recursive: true, force: true });
  if (sH) process.env.HOME = sH; if (sX) process.env.XDG_CONFIG_HOME = sX; else delete process.env.XDG_CONFIG_HOME;
});

test("detectShells only returns shells whose rc exists", () => {
  expect(detectShells()).toEqual([]);
  writeFileSync(join(home, ".zshrc"), "");
  expect(detectShells()).toEqual(["zsh"]);
});

test("nonInteractiveSetup registers cwd and saves", () => {
  const proj = mkdtempSync(join(tmpdir(), "app-"));
  const cfg = nonInteractiveSetup(proj);
  expect(Object.values(cfg.projects).map((p) => p.path)).toContain(proj);
  rmSync(proj, { recursive: true, force: true });
});
