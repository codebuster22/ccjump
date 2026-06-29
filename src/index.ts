#!/usr/bin/env bun
import { VERSION } from "./version";
import { loadConfig, loadOrDefault, saveConfig } from "./config";
import { addProject, removeProject, listProjects } from "./registry";
import { generateInit, isSupportedShell, SUPPORTED_SHELLS, type Shell } from "./shells";
import { run } from "./launch";

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
  const [cmd, ...args] = argv;
  if (cmd === "--version" || cmd === "-v") { console.log(VERSION); return 0; }
  if (!cmd || cmd === "--help" || cmd === "-h") { console.log(HELP); return 0; }

  switch (cmd) {
    case "init": {
      const shell = args[0];
      if (!shell || !isSupportedShell(shell)) { console.error(`ccjump: supported shells: ${SUPPORTED_SHELLS.join(", ")}`); return 1; }
      const cfg = loadConfig();
      if (!cfg) return 0; // silent: a leftover eval line must not spam shell startup
      process.stdout.write(generateInit(cfg, shell as Shell));
      return 0;
    }
    case "add": {
      const cfg = loadOrDefault();
      const nameIdx = args.indexOf("--name");
      const name = nameIdx >= 0 ? args[nameIdx + 1] : undefined;
      const skip = nameIdx >= 0 ? nameIdx + 1 : -1; // only skip the --name VALUE when present
      const path = args.find((a, i) => !a.startsWith("--") && i !== skip) ?? process.cwd();
      try { const r = addProject(cfg, path, name); saveConfig(cfg); console.log(`registered: ${r.name} -> ${r.path}`); return 0; }
      catch (e) { console.error(`ccjump: ${(e as Error).message}`); return 1; }
    }
    case "list": {
      const rows = listProjects(loadOrDefault());
      if (!rows.length) { console.log("no projects yet — run `ccjump add`"); return 0; }
      const w = Math.max(...rows.map((r) => r.name.length));
      for (const r of rows) console.log(`${r.name.padEnd(w)}  ${r.path}`);
      return 0;
    }
    case "remove": case "rm": {
      const cfg = loadOrDefault();
      try { removeProject(cfg, args[0]); saveConfig(cfg); console.log(`removed ${args[0]}`); return 0; }
      catch (e) { console.error(`ccjump: ${(e as Error).message}`); return 1; }
    }
    case "run": return await run(loadOrDefault(), args[0], args.slice(1));
    case "tty": {
      const cfg = loadOrDefault();
      const sub = args[0];
      if (sub === "on") { cfg.forceTty = true; saveConfig(cfg); console.log("ccjump: /dev/tty handling ON"); return 0; }
      if (sub === "off") { cfg.forceTty = false; saveConfig(cfg); console.log("ccjump: /dev/tty handling OFF"); return 0; }
      if (!sub || sub === "status") { console.log(`ccjump: /dev/tty handling is ${cfg.forceTty ? "ON" : "OFF"}`); return 0; }
      console.error("ccjump: usage: ccjump tty on|off|status"); return 1;
    }
    default: console.error(`ccjump: unknown command '${cmd}' (try --help)`); return 1;
  }
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((e) => { console.error(e); process.exit(1); });
