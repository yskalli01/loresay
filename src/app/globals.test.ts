import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("global design tokens", () => {
  it("defines the light theme token set for the UI foundation, covers AC-3", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    [
      "--color-canvas",
      "--color-surface",
      "--color-border",
      "--color-muted",
      "--color-body",
      "--color-ink",
      "--color-accent",
      "--color-on-accent",
      "--color-success",
      "--color-warning",
      "--color-error",
      "--color-focus",
      "--radius-sm",
      "--radius-md",
      "--radius-lg",
      "--shadow-panel",
      "--motion-fast",
      "--motion-base",
    ].forEach((token) => {
      expect(css).toContain(token);
    });
  });
});
