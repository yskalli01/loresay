import { prerender } from "react-dom/static";
import { describe, expect, it, vi } from "vitest";

import {
  MarkdownEditorField,
  normalizeEditorMarkdown,
} from "./markdown-editor-field";

vi.mock("./forward-ref-markdown-editor", () => ({
  ForwardRefMarkdownEditor: ({
    className,
    contentEditableClassName,
  }: {
    className?: string;
    contentEditableClassName?: string;
  }) => (
    <div
      data-content-class={contentEditableClassName}
      data-root-class={className}
    />
  ),
}));

describe("MarkdownEditorField", () => {
  it("removes encoded spaces from editor Markdown", () => {
    expect(
      normalizeEditorMarkdown(
        "hello\n\nMy name is Youssef&#x20;\n\nI want to be good",
      ),
    ).toBe("hello\n\nMy name is Youssef \n\nI want to be good");
  });

  it("keeps sizing classes off the body-level popup container", async () => {
    const { prelude } = await prerender(
      <MarkdownEditorField editorClassName="min-h-[360px]" />,
    );
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

    html += decoder.decode();
    expect(html).toContain('data-root-class="knowledge-editor"');
    expect(html).toContain(
      'data-content-class="knowledge-editor-content min-h-[360px]"',
    );
    expect(html).not.toContain(
      'data-root-class="knowledge-editor min-h-[360px]"',
    );
  });

  it("uses a textarea so submitted Markdown keeps line breaks", async () => {
    const { prelude } = await prerender(
      <MarkdownEditorField defaultMarkdown={"hello\n\nnext line"} />,
    );
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

    html += decoder.decode();
    expect(html).toContain("<textarea");
    expect(html).toContain("hello\n\nnext line</textarea>");
    expect(html).not.toContain('name="body" readOnly="" type="text"');
  });
});
