import { prerender } from "react-dom/static";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { SourceSummaryDto } from "@/domain/knowledge";

import { CollectionSourcePicker } from "./collection-source-picker";

const sources: SourceSummaryDto[] = [
  {
    created_at: new Date("2026-01-01T00:00:00Z"),
    source_id: "source-1",
    status: "ready",
    title: "Research notes",
    type: "note",
    updated_at: new Date("2026-01-01T00:00:00Z"),
  },
  {
    created_at: new Date("2026-01-02T00:00:00Z"),
    source_id: "source-2",
    status: "ready",
    title: "Project brief",
    type: "document",
    updated_at: new Date("2026-01-02T00:00:00Z"),
  },
];

async function renderMarkup(node: ReactNode) {
  const { prelude } = await prerender(node);
  const reader = prelude.getReader();
  const decoder = new TextDecoder();
  let html = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    html += decoder.decode(value, { stream: true });
  }

  return html + decoder.decode();
}

describe("CollectionSourcePicker", () => {
  it("renders one selectable checkbox for every source", async () => {
    const html = await renderMarkup(
      <CollectionSourcePicker sources={sources} />,
    );

    expect(html.match(/name="sourceIds"/g)).toHaveLength(2);
    expect(html).toContain('value="source-1"');
    expect(html).toContain('value="source-2"');
    expect(html).toContain("Research notes");
    expect(html).toContain("Project brief");
    expect(html).toContain("Select visible");
    expect(html).toContain("Search sources");
  });

  it("renders an empty state when no sources are available", async () => {
    const html = await renderMarkup(
      <CollectionSourcePicker
        emptyMessage="This collection has no sources to remove."
        label="Sources to remove"
        searchPlaceholder="Search sources to remove"
        sources={[]}
      />,
    );

    expect(html).toContain("Sources to remove");
    expect(html).toContain("This collection has no sources to remove.");
    expect(html).not.toContain('name="sourceIds"');
  });
});
