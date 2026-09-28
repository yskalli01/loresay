import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RootLayout, { metadata } from "./layout";

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
});
