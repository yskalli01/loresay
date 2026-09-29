import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const noteSource = {
  active_content_text: "Retrieval quality notes",
  created_at: new Date("2026-09-11T09:00:00.000Z"),
  source_id: "source-1",
  status: "ready",
  title: "Retrieval notes",
  type: "note",
  updated_at: new Date("2026-09-11T09:30:00.000Z"),
};

const urlSource = {
  active_content_text: "Readable web page text",
  created_at: new Date("2026-09-12T09:00:00.000Z"),
  source_id: "source-2",
  status: "ready",
  title: "Design system article",
  type: "url",
  updated_at: new Date("2026-09-12T09:30:00.000Z"),
};

const documentSource = {
  active_content_text: "Document text",
  created_at: new Date("2026-09-13T09:00:00.000Z"),
  source_id: "source-3",
  status: "failed",
  title: "Project brief",
  type: "document",
  updated_at: new Date("2026-09-13T09:30:00.000Z"),
};

const archivedSource = {
  active_content_text: "Archived text",
  created_at: new Date("2026-09-10T09:00:00.000Z"),
  source_id: "source-archived",
  status: "deleted",
  title: "Archived research",
  type: "note",
  updated_at: new Date("2026-09-10T09:30:00.000Z"),
};
const sources = [noteSource, urlSource, documentSource];

const listKnowledgeSources = vi.fn(
  async (input?: { filters?: { type?: string } }) => {
    const type = input?.filters?.type;

    return {
      items: type ? sources.filter((source) => source.type === type) : sources,
      next_cursor: null,
    };
  },
);

vi.mock("@/infrastructure/auth/session", () => ({
  requireSessionUser: vi.fn(async () => ({
    email: "person@example.com",
    id: "user-1",
  })),
}));

vi.mock("@/infrastructure/db/knowledge-repository", () => ({
  knowledgeRepository: {
    getDashboardSummary: vi.fn(async () => ({
      collections: [
        { collection_id: "collection-1", name: "Research", source_count: 1 },
      ],
      defaultThread: { threadId: "thread-1", title: "Grounded chat" },
      ingestion: {
        failedCount: 1,
        latestActivity: "2026-09-11T10:00:00.000Z",
        processingCount: 0,
        queuedCount: 0,
      },
      sources,
      tags: [{ name: "retrieval", source_count: 1, tag_id: "tag-1" }],
    })),
    listKnowledgeSources,
    listArchivedSources: vi.fn(async () => [archivedSource]),
  },
}));

vi.mock("./auth/actions", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/app/actions/knowledge", () => ({
  addSourceToCollectionAction: vi.fn(),
  addTagToSourceAction: vi.fn(),
  archiveSourceAction: vi.fn(),
  createCollectionAction: vi.fn(),
  createTagAction: vi.fn(),
  createTextDocumentAction: vi.fn(),
  createTextNoteAction: vi.fn(),
  createUrlSourceAction: vi.fn(),
  purgeSourceAction: vi.fn(),
  retrySourceIngestionAction: vi.fn(),
  updateTextNoteAction: vi.fn(),
}));

describe("Knowledge workspace routes", () => {
  async function renderRoute(
    importPage: () => Promise<{ default: () => Promise<ReactNode> }>,
  ) {
    const { default: Page } = await importPage();
    const page = await Page();

    return renderToStaticMarkup(page);
  }

  it("renders the overview shell with the focused navigation, covers AC-1", async () => {
    const html = await renderRoute(() => import("./page"));

    expect(html).toContain("AI Knowledge");
    expect(html).toContain("Primary navigation");
    expect(html).toContain("Overview");
    expect(html).toContain("Notes");
    expect(html).toContain("Ingestion");
    expect(html).toContain("Chat with AI");
    expect(html).toContain("Sources");
    expect(html).toContain('href="/notes"');
    expect(html).toContain('href="/ingestion"');
    expect(html).toContain('href="/chat"');
    expect(html).toContain('href="/sources"');
  });

  it("keeps the overview focused on status and recent work, covers AC-2", async () => {
    const html = await renderRoute(() => import("./page"));

    expect(html).toContain("Main pages");
    expect(html).toContain("Recent sources");
    expect(html).toContain("Ingestion status");
    expect(html).toContain("Retrieval notes");
    expect(html).not.toContain("Save a text note");
    expect(html).not.toContain("Ask your knowledge");
  });

  it("renders the notes page with note capture and editing, covers AC-3", async () => {
    const html = await renderRoute(() => import("./notes/page"));

    expect(html).toContain("Notes");
    expect(html).toContain("Write a note");
    expect(html).toContain("Saved notes");
    expect(html).toContain("Edit note body");
    expect(html).toContain("Retrieval quality notes");
  });

  it("renders the ingestion page with URL and document controls, covers AC-4", async () => {
    const html = await renderRoute(() => import("./ingestion/page"));

    expect(html).toContain("Add a URL");
    expect(html).toContain("Upload a document");
    expect(html).toContain("Processing status");
    expect(html).toContain("Design system article");
    expect(html).toContain("Project brief");
  });

  it("renders the chat page with retrieval scope selectors, covers AC-5", async () => {
    const html = await renderRoute(() => import("./chat/page"));

    expect(html).toContain("Chat with AI");
    expect(html).toContain("Ask your knowledge");
    expect(html).toContain("All collections");
    expect(html).toContain("All tags");
    expect(html).toContain("Retrieval scope");
  });

  it("renders the sources page with filters and organization, covers AC-6", async () => {
    const html = await renderRoute(() => import("./sources/page"));

    expect(html).toContain("Source library");
    expect(html).toContain("Any type");
    expect(html).toContain("Any status");
    expect(html).toContain("Privacy and data lifecycle");
    expect(html).toContain("Export knowledge");
    expect(html).toContain("Archived research");
    expect(html).toContain("Permanently purge");
    expect(html).toContain("Organization");
    expect(html).toContain("Research (1)");
    expect(html).toContain("retrieval (1)");
    expect(html).toContain("Source details");
  });

  it("keeps core shell landmarks and accessibility affordances, covers AC-7", async () => {
    const html = await renderRoute(() => import("./page"));

    expect(html).toContain('href="#main-content"');
    expect(html).toContain('id="main-content"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="Mobile navigation"');
  });
});
