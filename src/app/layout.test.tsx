import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RootLayout, { metadata, themeBootstrap } from "./layout";

describe("Root layout scaffold", () => {
  it("publishes product metadata", () => {
    expect(metadata).toMatchObject({
      title: "AI Personal Knowledge Base",
      description: "A private knowledge base with grounded AI answers.",
    });
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
