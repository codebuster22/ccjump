import { test, expect, afterEach } from "bun:test";
import os from "node:os";
import { assetName, configDir, homeDir } from "../src/platform";

test("assetName maps os/arch, .exe on windows", () => {
  expect(assetName("linux", "x64")).toBe("ccjump-linux-x64");
  expect(assetName("darwin", "arm64")).toBe("ccjump-darwin-arm64");
  expect(assetName("windows", "x64")).toBe("ccjump-windows-x64.exe");
});

const savedXDG = process.env.XDG_CONFIG_HOME;
afterEach(() => { if (savedXDG === undefined) delete process.env.XDG_CONFIG_HOME; else process.env.XDG_CONFIG_HOME = savedXDG; });

test("configDir honors XDG_CONFIG_HOME", () => {
  process.env.XDG_CONFIG_HOME = "/tmp/xdg";
  expect(configDir()).toBe("/tmp/xdg/ccjump");
});

test("homeDir(\"win32\") uses os.homedir() (ignores $HOME POSIX path)", () => {
  expect(homeDir("win32")).toBe(os.homedir());
});

test("homeDir(\"linux\") returns $HOME when set", () => {
  const savedHome = process.env.HOME;
  const tmp = "/tmp/fake-home-test";
  process.env.HOME = tmp;
  try {
    expect(homeDir("linux")).toBe(tmp);
  } finally {
    if (savedHome === undefined) delete process.env.HOME;
    else process.env.HOME = savedHome;
  }
});
