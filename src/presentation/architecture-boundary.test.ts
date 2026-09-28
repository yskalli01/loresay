import { describe, expect, it } from "vitest";

import * as navigation from "./app/navigation";
import * as ui from "./ui";

describe("presentation boundary", () => {
  it("exports UI primitives without pulling infrastructure code into the test graph, covers AC-6", () => {
    expect(navigation.navigationItems.map((item) => item.label)).toEqual([
      "Overview",
      "Notes",
      "Ingestion",
      "Chat with AI",
      "Sources",
    ]);
    expect(ui.Button).toBeTypeOf("function");
    expect(ui.SourceCard).toBeTypeOf("function");
  });
});
