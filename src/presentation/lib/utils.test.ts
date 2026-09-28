import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges conditional class names", () => {
    expect(cn("base", false && "hidden", ["rounded-md", "p-2"])).toBe(
      "base rounded-md p-2",
    );
  });

  it("keeps the later Tailwind class when utilities conflict", () => {
    expect(cn("p-2 text-sm", "p-4")).toBe("text-sm p-4");
  });
});
