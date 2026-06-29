// tests/launch.test.ts
import { test, expect, spyOn } from "bun:test";
import { defaultConfig } from "../src/config";
import { permFlag, buildArgs, run, shouldOfferTty, spawnCmd } from "../src/launch";

test("permFlag mapping", () => {
  expect(permFlag("skip")).toEqual(["--dangerously-skip-permissions"]);
  expect(permFlag("allow")).toEqual(["--allow-dangerously-skip-permissions"]);
  expect(permFlag("normal")).toEqual([]);
});

test("buildArgs composes perms + launchArgs + mode + passthrough", () => {
  const c = defaultConfig(); // skip + ["--verbose"]
  expect(buildArgs(c, [])).toEqual(["--dangerously-skip-permissions", "--verbose"]);
  expect(buildArgs(c, ["resume"])).toEqual(["--dangerously-skip-permissions", "--verbose", "--resume"]);
  expect(buildArgs(c, ["resume", "abc"])).toEqual(["--dangerously-skip-permissions", "--verbose", "--resume", "abc"]);
  expect(buildArgs(c, ["continue"])).toEqual(["--dangerously-skip-permissions", "--verbose", "--continue"]);
  expect(buildArgs(c, ["--model", "opus"])).toEqual(["--dangerously-skip-permissions", "--verbose", "--model", "opus"]);
  expect(buildArgs(c, ["--dangerously-skip-permissions"])).toEqual([
    "--dangerously-skip-permissions", "--verbose", "--dangerously-skip-permissions"
  ]);
});

test("spawnCmd wraps .cmd/.bat through cmd.exe on win32 only", () => {
  expect(spawnCmd("C:\\npm\\claude.cmd", ["--verbose"], "win32")).toEqual(["cmd.exe", "/c", "C:\\npm\\claude.cmd", "--verbose"]);
  expect(spawnCmd("C:\\x\\claude.exe", ["a"], "win32")).toEqual(["C:\\x\\claude.exe", "a"]);
  expect(spawnCmd("/usr/bin/claude", ["--verbose"], "linux")).toEqual(["/usr/bin/claude", "--verbose"]);
});

test("shouldOfferTty fires only on a quick non-zero exit in a tty, when not already forced", () => {
  expect(shouldOfferTty(1, 200, false, true)).toBe(true);
  expect(shouldOfferTty(0, 200, false, true)).toBe(false);  // clean exit
  expect(shouldOfferTty(1, 9000, false, true)).toBe(false); // ran a while (real session)
  expect(shouldOfferTty(1, 200, true, true)).toBe(false);   // already enabled
  expect(shouldOfferTty(1, 200, false, false)).toBe(false); // not interactive
  expect(shouldOfferTty(1, 200, false, true, "win32")).toBe(false); // /dev/tty unavailable on win32
});

test("run errors on unknown project", async () => {
  const spy = spyOn(console, "error").mockImplementation(() => {});
  expect(await run(defaultConfig(), "ghost", [])).toBe(1);
  spy.mockRestore();
});
