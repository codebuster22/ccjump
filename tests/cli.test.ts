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

test("no args prints usage and exits 0", async () => {
  const { code, out } = await cli([]);
  expect(code).toBe(0);
  expect(out).toContain("ccjump");
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
