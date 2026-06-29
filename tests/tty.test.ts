import { test, expect } from "bun:test";
import { isInteractive } from "../src/tty";
test("--non-interactive forces false", () => { expect(isInteractive(["--non-interactive"])).toBe(false); });
