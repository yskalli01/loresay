import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  it("offers the dark theme first and names the action", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);

    expect(html).toContain('aria-label="Switch to dark theme"');
    expect(html).toContain('title="Switch to dark theme"');
    expect(html).toContain('type="button"');
  });
});
