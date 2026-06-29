import { test, expect, afterEach } from "bun:test";
import { assetUrl, sha256, latestVersion, fetchChecksums } from "../src/download";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test("assetUrl format", () => {
  expect(assetUrl("1.2.3", "ccjump-linux-x64")).toBe("https://github.com/codebuster22/ccjump/releases/download/v1.2.3/ccjump-linux-x64");
});

test("sha256 known value", () => {
  expect(sha256(Buffer.from("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("latestVersion strips v", async () => {
  globalThis.fetch = (async () => new Response(JSON.stringify({ tag_name: "v2.0.1" }), { status: 200 })) as typeof fetch;
  expect(await latestVersion()).toBe("2.0.1");
});

test("fetchChecksums parses SHA256SUMS", async () => {
  const body = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad  ccjump-linux-x64\n";
  globalThis.fetch = (async () => new Response(body, { status: 200 })) as typeof fetch;
  const map = await fetchChecksums("1.0.0");
  expect(map["ccjump-linux-x64"]).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});
