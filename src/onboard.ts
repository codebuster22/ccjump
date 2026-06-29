import * as p from "@clack/prompts";
import { existsSync } from "node:fs";
import { SUPPORTED_SHELLS, rcPath, wireShell, type Shell } from "./shells";
import { addProject } from "./registry";
import { loadOrDefault, saveConfig, type Config, type Permissions } from "./config";

export function detectShells(): Shell[] {
  return SUPPORTED_SHELLS.filter((s) => existsSync(rcPath(s)));
}

export function currentShell(): Shell | null {
  const sh = process.env.SHELL;
  if (!sh) return null;
  const base = sh.split("/").pop() ?? "";
  return (SUPPORTED_SHELLS as string[]).includes(base) ? (base as Shell) : null;
}

export function nonInteractiveSetup(cwd: string): Config {
  const cfg = loadOrDefault();
  try { addProject(cfg, cwd); } catch {}
  saveConfig(cfg);
  return cfg;
}

export async function onboard(cwd: string): Promise<void> {
  p.intro("ccjump setup");
  const detected = detectShells();
  const current = currentShell();
  const shells = detected.length
    ? await p.multiselect({
        message: "Which shells should ccjump wire?",
        options: detected.map((s) => ({ value: s, label: s === current ? `${s} (current shell)` : s })),
        initialValues: detected,
        required: false,
      })
    : [];
  if (p.isCancel(shells)) { p.cancel("aborted"); return; }
  const perms = await p.select({
    message: "Permissions for launches:",
    options: [
      { value: "skip", label: "always skip (--dangerously-skip-permissions)" },
      { value: "allow", label: "available, off by default (--allow-dangerously-skip-permissions)" },
      { value: "normal", label: "normal" },
    ],
    initialValue: "skip",
  });
  if (p.isCancel(perms)) { p.cancel("aborted"); return; }
  const wantProject = await p.confirm({
    message: `Register a project now? (current directory: ${cwd})`,
    initialValue: true,
  });
  if (p.isCancel(wantProject)) { p.cancel("aborted"); return; }
  let projectPath: string | null = null;
  if (wantProject) {
    const entered = await p.text({ message: "Project path:", initialValue: cwd });
    if (p.isCancel(entered)) { p.cancel("aborted"); return; }
    projectPath = entered;
  }

  const cfg = loadOrDefault();
  cfg.permissions = perms as Permissions;
  if (projectPath && projectPath.length) {
    try { addProject(cfg, projectPath); } catch (e) { p.log.warn(String((e as Error).message)); }
  } else {
    p.log.info("No project registered — add one any time with `ccjump add`.");
  }
  const wired: string[] = [];
  for (const s of shells as Shell[]) { wireShell(s); wired.push(s); }
  cfg.wiredShells = wired;
  saveConfig(cfg);
  p.outro(`Done. Restart your shell or run: eval "$(ccjump init ${wired[0] ?? "zsh"})"`);
}
