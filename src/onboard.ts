import * as p from "@clack/prompts";
import { existsSync } from "node:fs";
import { SUPPORTED_SHELLS, rcPath, wireShell, type Shell } from "./shells";
import { addProject } from "./registry";
import { loadOrDefault, saveConfig, type Config, type Permissions } from "./config";

export function detectShells(): Shell[] {
  return SUPPORTED_SHELLS.filter((s) => existsSync(rcPath(s)));
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
  const shells = detected.length
    ? await p.multiselect({ message: "Which shells should ccjump wire?", options: detected.map((s) => ({ value: s, label: s })), initialValues: detected, required: false })
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
  const first = await p.text({ message: "Register a project (path):", initialValue: cwd });
  if (p.isCancel(first)) { p.cancel("aborted"); return; }

  const cfg = loadOrDefault();
  cfg.permissions = perms as Permissions;
  if (typeof first === "string" && first.length) { try { addProject(cfg, first); } catch (e) { p.log.warn(String((e as Error).message)); } }
  const wired: string[] = [];
  for (const s of shells as Shell[]) { wireShell(s); wired.push(s); }
  cfg.wiredShells = wired;
  saveConfig(cfg);
  p.outro(`Done. Restart your shell or run: eval "$(ccjump init ${wired[0] ?? "zsh"})"`);
}
