import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { homeDir } from "./platform";
import { MARKER_START, MARKER_END } from "./constants";
import { listProjects } from "./registry";
import type { Config } from "./config";

export type Shell = "bash" | "zsh";
export const SUPPORTED_SHELLS: Shell[] = ["bash", "zsh"];
export function isSupportedShell(s: string): s is Shell { return (SUPPORTED_SHELLS as string[]).includes(s); }

export function rcPath(shell: Shell): string {
  return `${homeDir()}/${shell === "zsh" ? ".zshrc" : ".bashrc"}`;
}

function sq(s: string): string { return `'${s.replace(/'/g, `'\\''`)}'`; }

export function generateInit(cfg: Config, _shell: Shell): string {
  const lines = listProjects(cfg).map(({ name }) => `${name} () { ccjump run ${sq(name)} "$@"; }`);
  return lines.length ? lines.join("\n") + "\n" : "";
}

export function evalBlock(shell: Shell): string {
  return `${MARKER_START}\neval "$(ccjump init ${shell})"\n${MARKER_END}\n`;
}
export function isWired(rc: string): boolean { return rc.includes(MARKER_START); }

export interface WireResult { changed: boolean; rc: string; }
export function wireShell(shell: Shell): WireResult {
  const rc = rcPath(shell);
  const content = existsSync(rc) ? readFileSync(rc, "utf8") : "";
  if (isWired(content)) return { changed: false, rc };
  const sep = content.length && !content.endsWith("\n") ? "\n\n" : content.length ? "\n" : "";
  appendFileSync(rc, sep + evalBlock(shell));
  return { changed: true, rc };
}
