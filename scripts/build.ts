// scripts/build.ts
import { $ } from "bun";
const targets: [string, string][] = [
  ["bun-linux-x64", "ccjump-linux-x64"],
  ["bun-linux-arm64", "ccjump-linux-arm64"],
  ["bun-darwin-x64", "ccjump-darwin-x64"],
  ["bun-darwin-arm64", "ccjump-darwin-arm64"],
  ["bun-windows-x64", "ccjump-windows-x64.exe"],
];
for (const [target, out] of targets) {
  console.log(`building ${out}`);
  await $`bun build --compile --target=${target} ./src/index.ts --outfile dist/${out}`;
}
