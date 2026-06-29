import os from "node:os";

export type OS = "linux" | "darwin" | "windows";
export type Arch = "x64" | "arm64";

export function detectOS(): OS {
  if (process.platform === "darwin") return "darwin";
  if (process.platform === "win32") return "windows";
  return "linux";
}
export function detectArch(): Arch {
  return process.arch === "arm64" ? "arm64" : "x64";
}
export function assetName(o: OS = detectOS(), a: Arch = detectArch()): string {
  const base = `ccjump-${o}-${a}`;
  return o === "windows" ? `${base}.exe` : base;
}
export function homeDir(): string { return process.env.HOME || os.homedir(); }
export function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const root = xdg && xdg.length > 0 ? xdg : `${homeDir()}/.config`;
  return `${root}/ccjump`;
}
export function configPath(): string { return `${configDir()}/config.json`; }
