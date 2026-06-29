import { test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultConfig, loadConfig, loadOrDefault, saveConfig, configPath, CONFIG_VERSION } from "../src/config";

let dir: string; const saved = process.env.XDG_CONFIG_HOME;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "ccj-")); process.env.XDG_CONFIG_HOME = dir; });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); if (saved === undefined) delete process.env.XDG_CONFIG_HOME; else process.env.XDG_CONFIG_HOME = saved; });

test("defaultConfig shape", () => {
  const c = defaultConfig();
  expect(c.version).toBe(CONFIG_VERSION);
  expect(c.permissions).toBe("skip");
  expect(c.launchArgs).toEqual(["--verbose"]);
  expect(c.forceTty).toBe(false);
  expect(c.projects).toEqual({});
});

test("save then load round-trips", () => {
  const c = defaultConfig(); c.projects["app"] = { path: "/x/app" };
  saveConfig(c);
  expect(loadConfig()?.projects.app.path).toBe("/x/app");
});

test("loadConfig returns null when absent", () => { expect(loadConfig()).toBeNull(); });

test("corrupt config is backed up and recovered", () => {
  saveConfig(defaultConfig());
  writeFileSync(configPath(), "{not json");
  const c = loadOrDefault();
  expect(c.permissions).toBe("skip");
  expect(existsSync(configPath() + ".bak")).toBe(true);
});
