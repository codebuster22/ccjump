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
export function homeDir(platform: string = process.platform): string {
  // On native Windows (incl. a win32 binary launched from Git Bash/MSYS2), $HOME is a POSIX
  // path like /c/Users/alice that Win32 file APIs can't resolve — use the OS API instead.
  if (platform === "win32") return os.homedir();
  return process.env.HOME || os.homedir();
}
export function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const root = xdg && xdg.length > 0 ? xdg : `${homeDir()}/.config`;
  return `${root}/ccjump`;
}
export function configPath(): string { return `${configDir()}/config.json`; }
