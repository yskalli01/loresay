import type { ReactNode } from "react";
import { prerender } from "react-dom/static";
import { describe, expect, it, vi } from "vitest";

import type {
  CollectionSummaryDto,
  SourceCitationDto,
  SourceDetailDto,
} from "@/application/knowledge/repositories";
import type { SourceSummaryDto } from "@/domain/knowledge";

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const noteSource = {
  active_content_text: "Retrieval quality notes",
  created_at: new Date("2026-09-11T09:00:00.000Z"),
  source_id: "source-1",
  status: "ready",
  title: "Retrieval notes",
  type: "note",
  updated_at: new Date("2026-09-11T09:30:00.000Z"),
} satisfies SourceSummaryDto;

const urlSource = {
  active_content_text: "Readable web page text",
  created_at: new Date("2026-09-12T09:00:00.000Z"),
  source_id: "source-2",
  status: "ready",
  title: "Design system article",
  type: "url",
  updated_at: new Date("2026-09-12T09:30:00.000Z"),
} satisfies SourceSummaryDto;

const documentSource = {
  active_content_text: "Document text",
  created_at: new Date("2026-09-13T09:00:00.000Z"),
  source_id: "source-3",
  status: "failed",
  title: "Project brief",
  type: "document",
  updated_at: new Date("2026-09-13T09:30:00.000Z"),
} satisfies SourceSummaryDto;

const archivedSource = {
  active_content_text: "Archived text",
  created_at: new Date("2026-09-10T09:00:00.000Z"),
  source_id: "source-archived",
  status: "deleted",
  title: "Archived research",
  type: "note",
  updated_at: new Date("2026-09-10T09:30:00.000Z"),
} satisfies SourceSummaryDto;
const sources = [noteSource, urlSource, documentSource];
const collections = [
  {
    collection_id: "collection-1",
    created_at: new Date("2026-09-10T09:00:00.000Z"),
    image_url: null,
    name: "Research",
    source_count: 1,
    updated_at: new Date("2026-09-10T09:30:00.000Z"),
  },
  {
    collection_id: "collection-2",
    created_at: new Date("2026-09-10T10:00:00.000Z"),
    image_url: "https://example.com/work.jpg",
    name: "Work",
    source_count: 1,
    updated_at: new Date("2026-09-10T10:30:00.000Z"),
  },
];

const sourceCitations = [
  {
    chunk_position: 1,
    citation_id: "citation-1",
    cited_at: new Date("2026-09-11T10:00:00.000Z"),
    content_version: 1,
    quote: "Retrieval should use owned ready sources.",
    rank: 1,
    thread_id: "thread-1",
    thread_title: "Grounded chat",
  },
] satisfies SourceCitationDto[];

const listKnowledgeSources = vi.fn(
  async (input?: {
    filters?: {
      collectionId?: string;
      query?: string;
      status?: string;
      type?: string;
    };
    limit?: number;
    offset?: number;
  }) => {
    const status = input?.filters?.status;
    const type = input?.filters?.type;
    const query = input?.filters?.query?.toLowerCase();

    const filtered = sources.filter((source) => {
      const matchesStatus = status ? source.status === status : true;
      const matchesType = type ? source.type === type : true;
      const matchesQuery = query
        ? source.title.toLowerCase().includes(query) ||
          source.active_content_text.toLowerCase().includes(query)
        : true;

      return matchesStatus && matchesType && matchesQuery;
    });
    const offset = input?.offset ?? 0;
    const limit = input?.limit ?? 50;

    return {
      items: filtered.slice(offset, offset + limit),
      next_cursor: null,
      total: filtered.length,
    };
  },
);
const getDashboardSummary = vi.fn(async () => ({
  collections,
  defaultThread: { threadId: "thread-1", title: "Grounded chat" },
  ingestion: {
    failedCount: 1,
    latestActivity: "2026-09-11T10:00:00.000Z",
    processingCount: 0,
    queuedCount: 0,
  },
  metrics: {
    noteSources: 42,
    totalSources: 128,
    unsortedSources: 7,
  },
  sources,
}));
const getSourceDetail = vi.fn(async (): Promise<SourceDetailDto> => ({
  active_content_text: "# Machine Learning Notes\n\n## Key Concepts",
  collections: [collections[0]],
  source: {
    ...noteSource,
    fingerprint: "note-1",
    metadata: { body_hash: "body-hash", note_id: "note-1" },
    type: "note",
  },
}));
const listCollections = vi.fn(async () => collections);
const listSourceCitations = vi.fn(async () => sourceCitations);
vi.mock("@/infrastructure/auth/session", () => ({
  getSessionUser: vi.fn(async () => ({
    email: "person@example.com",
    id: "user-1",
  })),
  requireSessionUser: vi.fn(async () => ({
    email: "person@example.com",
    id: "user-1",
  })),
}));

vi.mock("@/infrastructure/db/knowledge-repository", () => ({
  knowledgeRepository: {
    getProfile: vi.fn(async () => ({
      avatarStoragePath: null,
      avatarUpdatedAt: null,
      createdAt: new Date("2026-09-10T09:00:00.000Z"),
      displayName: "Person Example",
      id: "user-1",
      updatedAt: new Date("2026-09-10T09:00:00.000Z"),
    })),
    getDashboardSummary,
    getSourceDetail,
    listArchivedSources: vi.fn(async () => [archivedSource]),
    getCollectionDetail: vi.fn(async () => ({
      collection: collections[0],
      sources: [noteSource],
    })),
    listCollections,
    listKnowledgeSources,
    listSourceCitations,
  },
}));

vi.mock("./auth/actions", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/app/auth/actions", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/app/account/actions", () => ({
  deleteAccountAction: vi.fn(),
  removeProfileImageAction: vi.fn(),
  updateEmailAction: vi.fn(),
  updatePasswordAction: vi.fn(),
  updateProfileAction: vi.fn(),
  uploadProfileImageAction: vi.fn(),
}));
vi.mock("@/infrastructure/supabase/account-storage", () => ({
  createAvatarSignedUrl: vi.fn(async () => null),
}));

vi.mock("@/app/actions/knowledge", () => ({
  addSourceToCollectionAction: vi.fn(),
  addSourcesToCollectionAction: vi.fn(),
  archiveSourceAction: vi.fn(),
  createCollectionAction: vi.fn(),
  deleteCollectionAction: vi.fn(),
  deleteCollectionsAction: vi.fn(),
  deleteSourcesAction: vi.fn(),
  createTextDocumentAction: vi.fn(),
  createTextNoteAction: vi.fn(),
  createUrlSourceAction: vi.fn(),
  purgeSourceAction: vi.fn(),
  retrySourceIngestionAction: vi.fn(),
  removeSourcesFromCollectionAction: vi.fn(),
  updateCollectionAction: vi.fn(),
  updateKnowledgeSourceAction: vi.fn(),
  updateTextNoteAction: vi.fn(),
}));

describe("Knowledge workspace routes", () => {
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

    html += decoder.decode();
    return html;
  }

  async function renderRoute(
    importPage: () => Promise<{ default: () => Promise<ReactNode> }>,
  ) {
    const { default: Page } = await importPage();
    const page = await Page();

    return renderMarkup(page);
  }

  it("renders the shell with distinct navigation destinations, covers AC-1", async () => {
    const html = await renderRoute(() => import("./page"));

    expect(html).toContain("Knowledge Base");
    expect(html).toContain("Primary navigation");
    expect(html).toContain("Dashboard");
    expect(html).toContain("Sources");
    expect(html).toContain("Collections");
    expect(html).toContain("Chat");
    expect(html).toContain("Search");
    expect(html).toContain("Account settings");
    expect(html).toContain("Delete account");
    expect(html).toContain('href="/account"');
    expect(html).toContain('href="/sources"');
    expect(html).toContain('href="/collections"');
    expect(html).toContain('href="/chat"');
    expect(html).toContain('href="/search"');
    expect(html).not.toContain('aria-label="Notifications"');
    expect(html).toContain('aria-label="Switch to dark theme"');
  });

  it("keeps the overview focused on status and recent work, covers AC-2", async () => {
    const html = await renderRoute(() => import("./page"));

    expect(html).toContain("Quick Add");
    expect(html).toContain("Recent Activity");
    expect(html).toContain("Top Collections");
    expect(html).toContain("Retrieval notes");
    expect(html).toContain("New Source");
    expect(html).toMatch(
      /Sources[\s\S]*128[\s\S]*Total Sources[\s\S]*Collections[\s\S]*2[\s\S]*Collections[\s\S]*Notes[\s\S]*42[\s\S]*Note Sources[\s\S]*Unsorted[\s\S]*7[\s\S]*Not in a Collection/,
    );
    expect(html).toContain('href="/new-source"');
    expect(html).not.toContain("Ready Sources");
    expect(html).not.toContain("Chat Messages");
    expect(html).not.toContain(">320<");
    expect(html).not.toContain("New Note");
    expect(html).not.toContain("Upload File");
    expect(html).not.toContain("Save a text note");
    expect(html).not.toContain("Ask your knowledge");
  });

  it("caps recent activity and top collections at five rows, covers AC-1 to AC-3", async () => {
    const manySources = [0, 1, 2, 3, 4, 5, 6].map((index) => ({
      active_content_text: `Body for recent source ${index}`,
      created_at: new Date(Date.UTC(2026, 8, 1 + index)),
      source_id: `source-many-${index}`,
      status: "ready" as const,
      title: `Recent source ${index}`,
      type: "note" as const,
      // Newest first, matching the repository's updatedAt desc ordering.
      updated_at: new Date(Date.UTC(2026, 8, 20 - index)),
    }));
    const manyCollections: CollectionSummaryDto[] = [
      {
        collection_id: "collection-zeta",
        created_at: new Date(Date.UTC(2026, 8, 10)),
        image_url: null,
        name: "Zeta",
        source_count: 9,
        updated_at: new Date(Date.UTC(2026, 8, 11)),
      },
      {
        collection_id: "collection-empty",
        created_at: new Date(Date.UTC(2026, 8, 10)),
        image_url: null,
        name: "Empty",
        source_count: 0,
        updated_at: new Date(Date.UTC(2026, 8, 11)),
      },
      {
        collection_id: "collection-big",
        created_at: new Date(Date.UTC(2026, 8, 10)),
        image_url: null,
        name: "Big",
        source_count: 12,
        updated_at: new Date(Date.UTC(2026, 8, 11)),
      },
      {
        collection_id: "collection-alpha",
        created_at: new Date(Date.UTC(2026, 8, 10)),
        image_url: null,
        name: "Alpha",
        source_count: 9,
        updated_at: new Date(Date.UTC(2026, 8, 11)),
      },
      {
        collection_id: "collection-mid",
        created_at: new Date(Date.UTC(2026, 8, 10)),
        image_url: null,
        name: "Mid",
        source_count: 5,
        updated_at: new Date(Date.UTC(2026, 8, 11)),
      },
      {
        collection_id: "collection-small",
        created_at: new Date(Date.UTC(2026, 8, 10)),
        image_url: null,
        name: "Small",
        source_count: 3,
        updated_at: new Date(Date.UTC(2026, 8, 11)),
      },
      {
        collection_id: "collection-tiny",
        created_at: new Date(Date.UTC(2026, 8, 10)),
        image_url: null,
        name: "Tiny",
        source_count: 1,
        updated_at: new Date(Date.UTC(2026, 8, 11)),
      },
    ];

    getDashboardSummary.mockResolvedValueOnce({
      collections: manyCollections,
      defaultThread: { threadId: "thread-1", title: "Grounded chat" },
      ingestion: {
        failedCount: 0,
        latestActivity: "2026-09-11T10:00:00.000Z",
        processingCount: 0,
        queuedCount: 0,
      },
      metrics: {
        noteSources: 7,
        totalSources: 7,
        unsortedSources: 0,
      },
      sources: manySources,
    });

    const html = await renderRoute(() => import("./page"));

    for (let index = 0; index < 5; index += 1) {
      expect(html).toContain(`Recent source ${index}`);
    }
    expect(html).not.toContain("Recent source 5");
    expect(html).not.toContain("Recent source 6");

    expect(html).toMatch(/Big[\s\S]*Alpha[\s\S]*Zeta[\s\S]*Mid[\s\S]*Small/);
    expect(html).not.toContain("Tiny");
    expect(html).not.toContain("Empty");

    // The Collections metric keeps showing the total, not the capped card length.
    expect(html).toMatch(
      /Sources[\s\S]*>7<[\s\S]*Total Sources[\s\S]*Collections[\s\S]*>7<[\s\S]*Collections[\s\S]*Notes/,
    );
  });

  it("renders zero source metrics for an empty knowledge base", async () => {
    getDashboardSummary.mockResolvedValueOnce({
      collections: [],
      defaultThread: { threadId: "thread-1", title: "Grounded chat" },
      ingestion: {
        failedCount: 0,
        latestActivity: "2026-09-11T10:00:00.000Z",
        processingCount: 0,
        queuedCount: 0,
      },
      metrics: {
        noteSources: 0,
        totalSources: 0,
        unsortedSources: 0,
      },
      sources: [],
    });

    const html = await renderRoute(() => import("./page"));

    expect(html).toMatch(
      /Sources[\s\S]*>0<[\s\S]*Total Sources[\s\S]*Notes[\s\S]*>0<[\s\S]*Note Sources[\s\S]*Unsorted[\s\S]*>0<[\s\S]*Not in a Collection/,
    );
  });

  it("renders the merged new source page with note, document, and URL tabs, covers AC-3 and AC-4", async () => {
    const html = await renderRoute(() => import("./new-source/page"));

    expect(html).toContain("New Source");
    expect(html).toContain("Add source");
    expect(html).toContain('role="tablist"');
    expect(html).toContain("Write a note");
    expect(html).toContain("Recently added");
    expect(html).toContain("Retrieval notes");
    expect(html).toContain("Design system article");
    expect(html).toContain("Project brief");
    expect(html).not.toContain("Save changes");
    expect(html).not.toContain("Upload File");
    expect(html).not.toContain("Choose a method to add new content.");
  });

  it("renders the corrected chat page, covers AC-5", async () => {
    const html = await renderRoute(() => import("./chat/page"));

    expect(html).toContain("Chat with Your Knowledge");
    expect(html).toContain("Start a grounded chat");
    expect(html).not.toContain("What are the key concepts");
    expect(html).not.toContain("Machine Learning Notes");
    expect(html).toContain("All collections");
  });

  it("renders the sources library as a table without source settings, covers AC-6", async () => {
    const html = await renderRoute(() => import("./sources/page"));

    expect(html).toContain("Add Source");
    expect(html).toContain("Filter sources");
    expect(html).toContain("Any status");
    expect(html).toContain("Status");
    expect(html).not.toContain("Any type");
    expect(html).toContain("Documents");
    expect(html).toContain("URLs");
    expect(html).toContain("Collection");
    expect(html).toContain("Research");
    expect(html).toContain("Select visible sources");
    expect(html).toContain("Delete Selected");
    expect(html).toContain("Open actions for Retrieval notes");
    expect(html).not.toContain("Source Settings");
    expect(html).not.toContain("Permanently Delete");
  });

  it("renders source settings when a source is opened, covers AC-7", async () => {
    const { default: Page } = await import("./sources/[sourceId]/page");
    const page = await Page({
      params: Promise.resolve({ sourceId: "source-1" }),
    });
    const html = await renderMarkup(page);

    expect(html).toContain("Machine Learning Notes");
    expect(html).toContain("Source Settings");
    expect(html).toContain("Reprocess");
    expect(html).toContain("Archive");
    expect(html).toContain("Export");
    expect(html).toContain("Permanently Delete");
    expect(html).toContain('role="tablist"');
    expect(html).toContain('id="source-content-tab"');
    expect(html).toContain('id="source-citations-tab"');
    expect(html).toContain('id="source-content-panel"');
    expect(html).toContain('aria-labelledby="source-content-tab"');
    expect(html).toContain('aria-labelledby="source-citations-tab"');
    expect(html).toMatch(/hidden[^>]*id="source-citations-panel"/);
    expect(html).not.toMatch(/hidden[^>]*id="source-content-panel"/);
    const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, "");
    expect(visibleHtml).toContain("Grounded chat");
    expect(visibleHtml).toContain("Chunk 1");
    expect(visibleHtml).toContain("Retrieval should use owned ready sources.");
    expect(html).not.toContain('id="source-metadata-tab"');
    expect(html).not.toContain('id="source-chunks-tab"');
    expect(html).not.toContain("Source ID");
    expect(html).toContain('id="edit-source-source-1"');
    expect(html).not.toContain('href="#edit-source"');
    expect(html).not.toContain("Edit Note");
  });

  it("renders the same edit trigger for document and URL sources", async () => {
    getSourceDetail.mockResolvedValueOnce({
      active_content_text: "Document text",
      collections: [],
      source: {
        ...documentSource,
        fingerprint: "document-hash",
        metadata: {
          byte_size: 13,
          file_hash: "document-hash",
          file_name: "project-brief.md",
          mime_type: "text/markdown",
          storage_bucket: "inline-upload",
          storage_path: "inline-upload/document-hash/project-brief.md",
        },
        type: "document",
      },
    });
    const { default: Page } = await import("./sources/[sourceId]/page");
    const documentHtml = await renderMarkup(
      await Page({
        params: Promise.resolve({ sourceId: documentSource.source_id }),
      }),
    );

    getSourceDetail.mockResolvedValueOnce({
      active_content_text: "Readable web page text",
      collections: [],
      source: {
        ...urlSource,
        fingerprint: "url-hash",
        metadata: {
          canonical_url: "https://example.com/design",
          original_url: "https://example.com/design",
          url_hash: "url-hash",
        },
        type: "url",
      },
    });
    const urlHtml = await renderMarkup(
      await Page({
        params: Promise.resolve({ sourceId: urlSource.source_id }),
      }),
    );

    expect(documentHtml).toContain('id="edit-source-source-3"');
    expect(documentHtml).not.toContain('href="#edit-source"');
    expect(urlHtml).toContain('id="edit-source-source-2"');
    expect(urlHtml).toContain("Open URL");
    expect(urlHtml).not.toContain('href="#edit-source"');
  });

  it("renders distinct collections and search pages, covers AC-8", async () => {
    const collectionsHtml = await renderRoute(
      () => import("./collections/page"),
    );
    const searchHtml = await renderRoute(() => import("./search/page"));

    expect(collectionsHtml).toContain("New Collection");
    expect(collectionsHtml).toContain(
      "Organize saved sources, curate groups, and open focused collection views.",
    );
    expect(collectionsHtml).toContain("Delete Selected");
    expect(collectionsHtml).toContain("Any count");
    expect(collectionsHtml).not.toContain("Any image");
    expect(collectionsHtml).toContain('href="/collections/collection-1"');
    expect(searchHtml).toContain("Search across all your saved content");
    expect(searchHtml).toContain("results found");
    expect(searchHtml).toContain('name="q"');
    expect(searchHtml).not.toContain("neural networks");

    const accountHtml = await renderRoute(() => import("./account/page"));
    expect(accountHtml).toContain("Profile photo");
    expect(accountHtml).toContain("Account closure");
    expect(accountHtml).not.toContain("Danger Zone");
  });

  it("renders the collections filter panel in the sources page style", async () => {
    const html = await renderRoute(() => import("./collections/page"));

    expect(html).toContain("Filter collections");
    expect(html).toContain("No filters active");
    expect(html).toContain('name="q"');
    expect(html).toContain("More filters");
    expect(html).toContain("Apply filters");
    expect(html).toContain("Clear filters");
    expect(html).toContain('href="/collections"');
  });

  it("passes the collection added date range to the repository", async () => {
    const { default: Page } = await import("./collections/page");
    const page = await Page({
      searchParams: Promise.resolve({
        from: "2026-01-01",
        q: "re",
        sources: "with",
        to: "2026-03-31",
      }),
    });
    const html = await renderMarkup(page);

    expect(listCollections).toHaveBeenLastCalledWith({
      filters: {
        createdFrom: "2026-01-01",
        createdTo: "2026-03-31",
        hasSources: true,
        query: "re",
        sort: "name",
      },
      owner: { userId: "user-1" },
    });
    expect(html).toContain("Added from");
    expect(html).toContain("Added to");
    expect(html).toContain('name="from"');
    expect(html).toContain('name="to"');
    expect(html).toContain('type="date"');
    expect(html).toContain("4 active filters");
    expect(html).toContain("3 active");
  });

  it("passes submitted source filters to the source repository", async () => {
    const { default: Page } = await import("./sources/page");
    const page = await Page({
      searchParams: Promise.resolve({
        collection: "collection-1",
        q: "Project",
        status: "failed",
        type: "document",
      }),
    });
    const html = await renderMarkup(page);

    expect(listKnowledgeSources).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: {
          collectionId: "collection-1",
          query: "Project",
          status: "failed",
          type: "document",
        },
        limit: 24,
        owner: { userId: "user-1" },
      }),
    );
    expect(html).toContain("Project brief");
    expect(html).not.toContain("Retrieval quality notes");
  });

  it("passes submitted search text to the source repository", async () => {
    const { default: Page } = await import("./search/page");
    const page = await Page({
      searchParams: Promise.resolve({ q: "  readable  " }),
    });
    const html = await renderMarkup(page);

    expect(listKnowledgeSources).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: { query: "readable" },
        limit: 5,
        offset: 0,
        owner: { userId: "user-1" },
      }),
    );
    expect(html).toContain("Readable web page text");
    expect(html).not.toContain("Retrieval quality notes");
  });

  it("passes search filters to the source repository", async () => {
    const today = new Date();
    const createdTo = formatDay(today);
    const createdFrom = formatDay(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
    );

    const { default: Page } = await import("./search/page");
    const page = await Page({
      searchParams: Promise.resolve({
        collection: "11111111-1111-4111-8111-111111111111",
        q: "readable",
        time: "30d",
        type: "url",
      }),
    });
    await renderMarkup(page);

    expect(listKnowledgeSources).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: {
          collectionId: "11111111-1111-4111-8111-111111111111",
          createdFrom,
          createdTo,
          query: "readable",
          type: "url",
        },
        limit: 5,
        offset: 0,
        owner: { userId: "user-1" },
      }),
    );
  });

  it("ignores invalid search filter values", async () => {
    const { default: Page } = await import("./search/page");
    const page = await Page({
      searchParams: Promise.resolve({
        collection: "collection-1",
        time: "soon",
        type: "banana",
      }),
    });
    await renderMarkup(page);

    expect(listKnowledgeSources).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: {} }),
    );
  });

  it("renders the search filter selects with their options", async () => {
    const { default: Page } = await import("./search/page");
    const page = await Page({
      searchParams: Promise.resolve({ type: "url" }),
    });
    const html = await renderMarkup(page);

    expect(html).toContain('id="search-filter-type"');
    expect(html).toContain('id="search-filter-collection"');
    expect(html).toContain('id="search-filter-time"');
    expect(html).toContain("Filter by type");
    expect(html).toContain("Filter by collection");
    expect(html).toContain("Filter by time");
    expect(html).toContain("All Types");
    expect(html).toContain("All Collections");
    expect(html).toContain("Any Time");
    expect(html).toContain("Last 7 days");
    expect(html).toContain("Last 30 days");
    expect(html).toContain("Research");
    expect(html).toContain("Work");

    expect(optionTag(html, "URL")).toContain("selected");
    expect(optionTag(html, "Note")).not.toContain("selected");
  });

  it("paginates search results five at a time, covers AC-10", async () => {
    vi.mocked(listKnowledgeSources).mockResolvedValueOnce({
      items: sources.slice(0, 5),
      next_cursor: null,
      total: 12,
    });
    const { default: Page } = await import("./search/page");
    const page = await Page({
      searchParams: Promise.resolve({ page: "3", q: "readable" }),
    });
    const html = await renderMarkup(page);

    expect(listKnowledgeSources).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: { query: "readable" },
        limit: 5,
        offset: 10,
        owner: { userId: "user-1" },
      }),
    );
    expect(html).toContain('aria-label="Pagination"');
    expect(html).toContain('href="/search?q=readable&amp;page=2"');
    expect(html).toContain('href="/search?q=readable&amp;page=3"');
    expect(html).toContain('aria-current="page"');
    expect(html).toMatch(/12<!-- --> results found/);
  });

  it("shows the pagination panel only when results span more than one page", async () => {
    const { default: Page } = await import("./search/page");

    const singlePage = await renderMarkup(
      await Page({ searchParams: Promise.resolve({ q: "readable" }) }),
    );

    expect(singlePage).not.toContain('aria-label="Pagination"');
    expect(singlePage).not.toContain("p-4 shadow-card");

    vi.mocked(listKnowledgeSources).mockResolvedValueOnce({
      items: sources,
      next_cursor: null,
      total: 12,
    });

    const paginated = await renderMarkup(
      await Page({ searchParams: Promise.resolve({ q: "readable" }) }),
    );

    expect(paginated).toContain('aria-label="Pagination"');
    expect(paginated).toContain("p-4 shadow-card");
  });

  it("keeps search results as cards rather than a table", async () => {
    const html = await renderRoute(() => import("./search/page"));

    expect(html).toContain("results found");
    expect(html).not.toContain("<table");
    expect(html).not.toContain('aria-label="Pagination"');
  });

  it("opens a collection detail page with its contained sources", async () => {
    const { default: Page } = await import("./collections/[collectionId]/page");
    const page = await Page({
      params: Promise.resolve({ collectionId: "collection-1" }),
    });
    const html = await renderMarkup(page);

    expect(html).toContain("Research");
    expect(html).toContain("Sources in this collection");
    expect(html).toContain("Manage sources");
    expect(html).toContain("Add sources");
    expect(html).toContain("Remove sources");
    expect(html).toContain("Sources to remove");
    expect(html).toContain("Retrieval notes");
  });

  it("keeps core shell landmarks and accessibility affordances, covers AC-9", async () => {
    const html = await renderRoute(() => import("./page"));

    expect(html).toContain('href="#main-content"');
    expect(html).toContain('id="main-content"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="Mobile navigation"');
  });
});

function formatDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function optionTag(html: string, label: string) {
  const match = html.match(
    new RegExp(`<option[^>]*>(?:<!-- -->)?${label}</option>`),
  );

  return match?.[0] ?? "";
}
