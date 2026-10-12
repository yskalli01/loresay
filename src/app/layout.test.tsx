import { existsSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RootLayout, { metadata, themeBootstrap } from "./layout";

describe("Root layout scaffold", () => {
  it("publishes product metadata", () => {
    expect(metadata).toMatchObject({
      title: "Loresay",
      description:
        "Private notes, grounded answers, and citations you can trace.",
    });
  });

  it("uses the Loresay symbol instead of the default favicon", () => {
    expect(existsSync(join(process.cwd(), "src/app/icon.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/app/favicon.ico"))).toBe(false);
  });

  it("renders children inside the English document shell", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <span>shell child</span>
      </RootLayout>,
    );

    expect(html).toContain('<html lang="en"');
    expect(html).toContain("<body");
    expect(html).toContain("shell child");
  });

  it("applies the stored theme before first paint", () => {
    expect(themeBootstrap).toContain('localStorage.getItem("theme")');
    expect(themeBootstrap).toContain(
      'matchMedia("(prefers-color-scheme: dark)")',
    );
    expect(themeBootstrap).toContain("classList.toggle");
  });
});
