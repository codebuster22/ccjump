import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { configDir, configPath } from "./platform";

export { configPath };

export type Permissions = "skip" | "allow" | "normal";
export interface ProjectEntry { path: string; }
export interface Config {
  version: number; permissions: Permissions; launchArgs: string[];
  forceTty: boolean; wiredShells: string[]; projects: Record<string, ProjectEntry>;
  lastUpdateCheck?: number; latestKnown?: string;
}
export const CONFIG_VERSION = 1;

export function defaultConfig(): Config {
  return { version: CONFIG_VERSION, permissions: "skip", launchArgs: ["--verbose"], forceTty: false, wiredShells: [], projects: {} };
}
export function configExists(): boolean { return existsSync(configPath()); }

export function loadConfig(): Config | null {
  const p = configPath();
  if (!existsSync(p)) return null;
  try { return migrate(JSON.parse(readFileSync(p, "utf8")) as Config); }
  catch { try { renameSync(p, p + ".bak"); } catch {} return defaultConfig(); }
}
export function loadOrDefault(): Config { return loadConfig() ?? defaultConfig(); }

export function saveConfig(cfg: Config): void {
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(configPath(), JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

function migrate(c: Config): Config {
  return {
    version: CONFIG_VERSION,
    permissions: c.permissions ?? "skip",
    launchArgs: c.launchArgs ?? ["--verbose"],
    forceTty: c.forceTty ?? false,
    wiredShells: c.wiredShells ?? [],
    projects: c.projects ?? {},
    lastUpdateCheck: c.lastUpdateCheck, latestKnown: c.latestKnown,
  };
}
