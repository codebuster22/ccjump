// tests/upgrade.test.ts
import { test, expect, afterEach } from "bun:test";
import { isNewer, maybeNotify } from "../src/upgrade";
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
