import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Link from "next/link";

import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  Label,
  LoadingState,
  Sheet,
  SourceCard,
} from ".";

describe("UI primitives", () => {
  it("renders labelled form controls and disabled button state, covers AC-4 and AC-5", () => {
    const html = renderToStaticMarkup(
      <form>
        <Label htmlFor="title">Title</Label>
        <Input id="title" invalid placeholder="Source title" />
        <Button disabled>Save</Button>
      </form>,
    );

    expect(html).toContain('for="title"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("disabled");
  });

  it("renders empty, loading, and error states with semantic roles, covers AC-4 and AC-5", () => {
    const html = renderToStaticMarkup(
      <>
        <EmptyState description="Nothing is saved yet." title="Empty" />
        <LoadingState label="Loading sources" />
        <ErrorState description="Try again later." title="Failed" />
      </>,
    );

    expect(html).toContain("Nothing is saved yet.");
    expect(html).toContain('role="status"');
    expect(html).toContain('role="alert"');
  });

  it("renders source cards with text backed status labels, covers AC-4", () => {
    const html = renderToStaticMarkup(
      <SourceCard
        status="ready"
        title="Product notes"
        type="note"
        updatedAt="2026-09-10"
      />,
    );

    expect(html).toContain("Product notes");
    expect(html).toContain("ready");
    expect(html).toContain("<time");
  });

  it("renders sheet navigation with a native viewport-bounded disclosure, covers AC-1 and AC-5", () => {
    const html = renderToStaticMarkup(
      <Sheet label="Menu">
        <Link href="/">Knowledge</Link>
      </Sheet>,
    );

    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("right-0");
    expect(html).toContain("w-64");
    expect(html).toContain("max-w-[calc(100vw-2rem)]");
    expect(html).toContain("Menu");
  });
});
