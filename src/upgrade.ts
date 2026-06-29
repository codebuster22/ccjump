// src/upgrade.ts
import { renameSync, chmodSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { VERSION } from "./version";
import { detectOS, assetName } from "./platform";
import { latestVersion, assetUrl, downloadTo, fetchChecksums, sha256 } from "./download";
import { saveConfig, type Config } from "./config";
import { NO_UPDATE_CHECK_ENV } from "./constants";

export function isNewer(latest: string, current: string): boolean {
  const a = latest.split(".").map(Number), b = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) { const x = a[i] ?? 0, y = b[i] ?? 0; if (x > y) return true; if (x < y) return false; }
  return false;
}

export async function upgrade(self: string = process.execPath): Promise<number> {
  const latest = await latestVersion();
  if (!isNewer(latest, VERSION)) { console.log(`ccjump ${VERSION} is up to date`); return 0; }
  const asset = assetName();
  const tmp = join(dirname(self), `.ccjump-${latest}.tmp`);
  await downloadTo(assetUrl(latest, asset), tmp);
  try {
    const want = (await fetchChecksums(latest))[asset];
    if (!want || sha256(readFileSync(tmp)) !== want) {
      console.error("ccjump: checksum mismatch — aborting");
      try { unlinkSync(tmp); } catch { /* best-effort */ }
      return 1;
    }
    if (detectOS() === "windows") { renameSync(self, self + ".old"); renameSync(tmp, self); }
    else { chmodSync(tmp, 0o755); renameSync(tmp, self); }
  } catch (e) {
    try { unlinkSync(tmp); } catch { /* best-effort */ }
    throw e;
  }
  console.log(`ccjump upgraded ${VERSION} -> ${latest}`);
  return 0;
}

const DAY = 24 * 60 * 60 * 1000;
export async function maybeNotify(cfg: Config, now: number, interactive: boolean): Promise<void> {
  if (!interactive || process.env[NO_UPDATE_CHECK_ENV] === "1") return;
  if (cfg.lastUpdateCheck && now - cfg.lastUpdateCheck < DAY) {
    if (cfg.latestKnown && isNewer(cfg.latestKnown, VERSION)) notify(cfg.latestKnown);
    return;
  }
  try {
    const latest = await latestVersion();
    cfg.lastUpdateCheck = now; cfg.latestKnown = latest; saveConfig(cfg);
    if (isNewer(latest, VERSION)) notify(latest);
  } catch { /* offline: ignore */ }
}
function notify(v: string): void { console.error(`(ccjump ${v} available — run \`ccjump upgrade\`)`); }
