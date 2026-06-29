import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { REPO_SLUG } from "./constants";

const UA = { "User-Agent": "ccjump" };

export async function latestVersion(): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${REPO_SLUG}/releases/latest`, { headers: UA });
  if (!res.ok) throw new Error(`release check failed: ${res.status}`);
  const data = (await res.json()) as { tag_name: string };
  return data.tag_name.replace(/^v/, "");
}
export function assetUrl(version: string, asset: string): string {
  return `https://github.com/${REPO_SLUG}/releases/download/v${version}/${asset}`;
}
export async function downloadTo(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}
export function sha256(data: Buffer): string { return createHash("sha256").update(data).digest("hex"); }
export async function fetchChecksums(version: string): Promise<Record<string, string>> {
  const res = await fetch(assetUrl(version, "SHA256SUMS"), { headers: UA });
  if (!res.ok) throw new Error(`checksums fetch failed: ${res.status}`);
  const map: Record<string, string> = {};
  for (const line of (await res.text()).split("\n")) {
    const m = line.trim().match(/^([0-9a-f]{64})\s+\*?(.+)$/);
    if (m) map[m[2]] = m[1];
  }
  return map;
}
