import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CitationList } from "./chat-panel";

describe("CitationList", () => {
  it("renders clear citation labels, source titles, and excerpts", () => {
    const html = renderToStaticMarkup(
      <CitationList
        citations={[
          {
            citation_id: "citation-1",
            quote: "Retrieval should use owned ready sources.",
            rank: 1,
            source_title_snapshot: "Retrieval notes",
          },
        ]}
      />,
    );

    expect(html).toContain("Sources cited");
    expect(html).toContain("[1]");
    expect(html).toContain("Retrieval notes");
    expect(html).toContain("Chunk 1");
    expect(html).toContain("Retrieval should use owned ready sources.");
  });

  it("renders nothing for unsupported answers without citations", () => {
    const html = renderToStaticMarkup(<CitationList citations={[]} />);

    expect(html).toBe("");
  });
});
