import { existsSync, statSync } from "node:fs";
import { resolve, basename } from "node:path";
import type { Config } from "./config";

export function deriveName(p: string): string { return basename(resolve(p)); }
export function isValidName(name: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name);
}

export interface AddResult { name: string; path: string; }
export function addProject(cfg: Config, rawPath: string, name?: string): AddResult {
  const path = resolve(rawPath);
  if (!existsSync(path) || !statSync(path).isDirectory()) throw new Error(`not a directory: ${path}`);
  const finalName = name ?? deriveName(path);
  if (!isValidName(finalName)) throw new Error(`invalid command name '${finalName}' — use letters, digits, '-', '_', '.' (pass --name)`);
  const existing = cfg.projects[finalName];
  if (existing && existing.path !== path) throw new Error(`name '${finalName}' already maps to ${existing.path} — choose another with --name`);
  cfg.projects[finalName] = { path };
  return { name: finalName, path };
}

export function removeProject(cfg: Config, name: string): void {
  if (!cfg.projects[name]) throw new Error(`no project named '${name}'`);
  delete cfg.projects[name];
}

export interface ProjectRow { name: string; path: string; }
export function listProjects(cfg: Config): ProjectRow[] {
  return Object.entries(cfg.projects).map(([name, e]) => ({ name, path: e.path }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
