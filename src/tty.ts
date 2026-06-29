export function isInteractive(argv: string[]): boolean {
  if (argv.includes("--non-interactive")) return false;
  return process.stdin.isTTY === true;
}
