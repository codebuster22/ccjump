// tests/upgrade.test.ts
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assetName } from "../src/platform";
import { isNewer, maybeNotify, upgrade } from "../src/upgrade";
import { defaultConfig } from "../src/config";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; delete process.env.CCJUMP_NO_UPDATE_CHECK; });

test("isNewer compares semver", () => {
  expect(isNewer("1.2.0", "1.1.9")).toBe(true);
  expect(isNewer("1.1.0", "1.1.0")).toBe(false);
  expect(isNewer("0.9.0", "1.0.0")).toBe(false);
});

test("maybeNotify skips when non-interactive", async () => {
  let called = false;
  globalThis.fetch = (async () => { called = true; return new Response("{}"); }) as typeof fetch;
  await maybeNotify(defaultConfig(), Date.now(), false);
  expect(called).toBe(false);
});

test("maybeNotify respects opt-out env", async () => {
  process.env.CCJUMP_NO_UPDATE_CHECK = "1";
  let called = false;
  globalThis.fetch = (async () => { called = true; return new Response("{}"); }) as typeof fetch;
  await maybeNotify(defaultConfig(), Date.now(), true);
  expect(called).toBe(false);
});

test("maybeNotify uses cache within a day (no fetch)", async () => {
  let called = false;
  globalThis.fetch = (async () => { called = true; return new Response("{}"); }) as typeof fetch;
  const cfg = defaultConfig(); cfg.lastUpdateCheck = 1000; cfg.latestKnown = "0.0.0";
  await maybeNotify(cfg, 1000 + 60_000, true);
  expect(called).toBe(false);
});

test("upgrade aborts and cleans up tmp on checksum mismatch, without replacing self", async () => {
  const dir = mkdtempSync(join(tmpdir(), "upg-"));
  const self = join(dir, "ccjump");
  writeFileSync(self, "ORIGINAL");
  const asset = assetName();
  globalThis.fetch = (async (url: string | URL) => {
    const u = String(url);
    if (u.includes("releases/latest")) return new Response(JSON.stringify({ tag_name: "v999.0.0" }), { status: 200 });
    if (u.includes("SHA256SUMS")) return new Response(`${"0".repeat(64)}  ${asset}\n`, { status: 200 });
    return new Response("BINARY-BYTES", { status: 200 });
  }) as typeof fetch;

  const code = await upgrade(self);
  expect(code).toBe(1);
  expect(readFileSync(self, "utf8")).toBe("ORIGINAL");                 // self NOT replaced
  expect(existsSync(join(dir, ".ccjump-999.0.0.tmp"))).toBe(false);    // tmp cleaned up
  rmSync(dir, { recursive: true, force: true });
});
