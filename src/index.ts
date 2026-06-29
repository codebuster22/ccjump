#!/usr/bin/env bun
import { VERSION } from "./version";

const HELP = `ccjump — jump into a project and launch Claude Code

Usage:
  ccjump                     run onboarding (first time)
  ccjump add [path]          register a project (default: current dir)
  ccjump list                list registered projects
  ccjump remove <name>       unregister a project
  ccjump init bash|zsh       print shell functions (for eval)
  ccjump run <name> [args]   launch Claude Code in a project
  ccjump setup               re-run onboarding
  ccjump tty on|off|status   route Claude through /dev/tty (interactive-mode fix)
  ccjump upgrade             update ccjump to the latest release
  ccjump --version | --help

Unofficial. Not affiliated with or endorsed by Anthropic.`;

async function main(argv: string[]): Promise<number> {
  const [cmd] = argv;
  if (cmd === "--version" || cmd === "-v") { console.log(VERSION); return 0; }
  if (!cmd || cmd === "--help" || cmd === "-h") { console.log(HELP); return 0; }
  console.error(`ccjump: unknown command '${cmd}' (try --help)`);
  return 1;
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((e) => { console.error(e); process.exit(1); });
