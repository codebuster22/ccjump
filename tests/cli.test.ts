// tests/cli.test.ts
import { test, expect } from "bun:test";

async function cli(args: string[]) {
  const proc = Bun.spawn({ cmd: ["bun", "run", "src/index.ts", ...args], stdout: "pipe", stderr: "pipe" });
  const code = await proc.exited;
  return { code, out: await new Response(proc.stdout).text(), err: await new Response(proc.stderr).text() };
}

test("--version prints semver", async () => {
  const { code, out } = await cli(["--version"]);
  expect(code).toBe(0);
  expect(out.trim()).toMatch(/^\d+\.\d+\.\d+$/);
});

test("--help prints usage and exits 0", async () => {
  const { code, out } = await cli(["--help"]);
  expect(code).toBe(0);
  expect(out).toContain("ccjump");
});

test("no args lists registered projects when a config exists", async () => {
  const xdg = mkdtempSync(join(tmpdir(), "xdg-"));
  const proj = mkdtempSync(join(tmpdir(), "app-"));
  await cliEnv(["add", proj], xdg);            // seed a config so configExists() is true
  const name = proj.split("/").pop()!;
  const { code, out } = await cliEnv([], xdg); // no-args WITH config -> list projects
  expect(code).toBe(0);
  expect(out).toContain(name);       // shows the registered project
  expect(out).toContain("--help");   // hints at full usage
  rmSync(xdg, { recursive: true, force: true });
  rmSync(proj, { recursive: true, force: true });
});

test("-h prints usage and exits 0", async () => {
  const { code, out } = await cli(["-h"]);
  expect(code).toBe(0);
  expect(out).toContain("ccjump");
});

test("unknown command exits non-zero", async () => {
  const { code, err } = await cli(["frobnicate"]);
  expect(code).toBe(1);
  expect(err).toContain("unknown command");
});

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function env(xdg: string) { return { ...process.env, XDG_CONFIG_HOME: xdg }; }
async function cliEnv(args: string[], xdg: string) {
  const proc = Bun.spawn({ cmd: ["bun", "run", "src/index.ts", ...args], env: env(xdg), stdout: "pipe", stderr: "pipe" });
  const code = await proc.exited;
  return { code, out: await new Response(proc.stdout).text(), err: await new Response(proc.stderr).text() };
}

test("add then list then init", async () => {
  const xdg = mkdtempSync(join(tmpdir(), "xdg-"));
  const proj = mkdtempSync(join(tmpdir(), "app-"));
  const add = await cliEnv(["add", proj], xdg);
  expect(add.code).toBe(0);
  const name = proj.split("/").pop()!;
  const list = await cliEnv(["list"], xdg);
  expect(list.out).toContain(name);
  const init = await cliEnv(["init", "zsh"], xdg);
  expect(init.out).toContain(`ccjump run '${name}'`);
  rmSync(xdg, { recursive: true, force: true }); rmSync(proj, { recursive: true, force: true });
});

test("init with no config is silent (no stdout/stderr, exit 0)", async () => {
  const xdg = mkdtempSync(join(tmpdir(), "xdg-"));
  const r = await cliEnv(["init", "zsh"], xdg);
  expect(r.out).toBe("");
  expect(r.err).toBe("");
  expect(r.code).toBe(0);
  rmSync(xdg, { recursive: true, force: true });
});

test("init with unsupported shell is inert", async () => {
  const xdg = mkdtempSync(join(tmpdir(), "xdg-"));
  const r = await cliEnv(["init", "fish"], xdg);
  expect(r.out).toBe("");
  expect(r.code).toBe(1);
  rmSync(xdg, { recursive: true, force: true });
});

test("tty on/status toggles forceTty", async () => {
  const xdg = mkdtempSync(join(tmpdir(), "xdg-"));
  expect((await cliEnv(["tty", "status"], xdg)).out).toContain("OFF");
  expect((await cliEnv(["tty", "on"], xdg)).out).toContain("ON");
  expect((await cliEnv(["tty", "status"], xdg)).out).toContain("ON");
  rmSync(xdg, { recursive: true, force: true });
});
