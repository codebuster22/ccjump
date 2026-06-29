import { existsSync, openSync, readSync, closeSync } from "node:fs";
import { saveConfig, type Config, type Permissions } from "./config";

export function permFlag(p: Permissions): string[] {
  if (p === "skip") return ["--dangerously-skip-permissions"];
  if (p === "allow") return ["--allow-dangerously-skip-permissions"];
  return [];
}

export function buildArgs(cfg: Config, rest: string[]): string[] {
  const mode: string[] = [];
  let pass = rest;
  if (rest[0] === "resume") { mode.push("--resume"); pass = rest.slice(1); }
  else if (rest[0] === "continue") { mode.push("--continue"); pass = rest.slice(1); }
  return [...permFlag(cfg.permissions), ...cfg.launchArgs, ...mode, ...pass];
}

export function findClaude(): string | null { return Bun.which("claude"); }

export const FAIL_WINDOW_MS = 5000;

// An immediate non-zero exit in an interactive terminal is the signature of Claude failing
// to start its TUI (some setups, e.g. WSL+oh-my-zsh, intermittently don't hand a launched
// process a real tty). Only offer the /dev/tty workaround then — and not if already enabled.
export function shouldOfferTty(code: number, elapsedMs: number, forceTty: boolean, stdoutIsTty: boolean): boolean {
  return !forceTty && stdoutIsTty && code !== 0 && elapsedMs < FAIL_WINDOW_MS;
}

// Spawn claude in `cwd`. When useTty, hand it the controlling terminal (/dev/tty) — the fix
// for setups where inherited stdio isn't a real tty. Falls back to inherit if /dev/tty can't open.
function spawnClaude(claude: string, args: string[], cwd: string, useTty: boolean): Promise<number> {
  let io: number | "inherit" = "inherit";
  if (useTty) { try { io = openSync("/dev/tty", "r+"); } catch { io = "inherit"; } }
  return Bun.spawn({ cmd: [claude, ...args], cwd, stdin: io, stdout: io, stderr: io }).exited;
}

// Synchronous y/N read straight from the controlling terminal (reliable post-launch).
function promptYesNo(question: string): boolean {
  process.stderr.write(question);
  let fd: number;
  try { fd = openSync("/dev/tty", "r"); } catch { return false; }
  try {
    const buf = Buffer.alloc(16);
    const n = readSync(fd, buf, 0, buf.length, null);
    const ans = buf.toString("utf8", 0, n).trim().toLowerCase();
    return ans === "y" || ans === "yes";
  } catch { return false; } finally { closeSync(fd); }
}

export async function run(cfg: Config, name: string, rest: string[], now: () => number = Date.now): Promise<number> {
  const entry = cfg.projects[name];
  if (!entry) { console.error(`ccjump: no project named '${name}'`); return 1; }
  if (!existsSync(entry.path)) { console.error(`ccjump: path no longer exists: ${entry.path}`); return 1; }
  const claude = findClaude();
  if (!claude) { console.error("ccjump: 'claude' not found on PATH. Install: npm i -g @anthropic-ai/claude-code"); return 127; }
  const args = buildArgs(cfg, rest);

  if (cfg.forceTty) return await spawnClaude(claude, args, entry.path, true);

  const start = now();
  const code = await spawnClaude(claude, args, entry.path, false);
  if (shouldOfferTty(code, now() - start, cfg.forceTty, process.stdout.isTTY === true)) {
    console.error("\nccjump: Claude exited immediately without starting interactive mode.");
    console.error("Some terminals (e.g. WSL + oh-my-zsh) intermittently fail to hand a launched");
    console.error("process the terminal. ccjump can route Claude through /dev/tty to fix this.");
    if (promptYesNo("Enable automatic /dev/tty handling for future launches? [y/N] ")) {
      cfg.forceTty = true; saveConfig(cfg);
      console.error("ccjump: enabled — re-launching…\n");
      return await spawnClaude(claude, args, entry.path, true);
    }
  }
  return code;
}
