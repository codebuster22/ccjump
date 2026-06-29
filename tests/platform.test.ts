import { test, expect, afterEach } from "bun:test";
import { assetName, configDir } from "../src/platform";

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
