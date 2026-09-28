import { describe, expect, it, vi } from "vitest";

import type {
  AnswerCitationInput,
  KnowledgeRepository,
  KnowledgeSourceRecord,
  RetrievalChunkDto,
} from "./repositories";
import {
  answerQuestion,
  archiveSource,
  saveTextDocument,
  saveTextNote,
  saveUrlSource,
  retrySourceIngestion,
  updateTextNote,
  type AnswerGateway,
} from "./thin-loop";

function createRepository(): KnowledgeRepository {
  return {
    assertCollectionAndSourceShareOwner: vi.fn(),
    assertTagAndSourceShareOwner: vi.fn(),
    createChatThread: vi.fn(async ({ title }) => ({
      threadId: "thread-1",
      title,
    })),
    createIngestionJob: vi.fn(async ({ status }) => ({
      jobId: "job-1",
      status,
    })),
    createKnowledgeSource: vi.fn(async ({ status, title, type }) => ({
      active_content_text: null,
      created_at: new Date("2026-01-01T00:00:00Z"),
      source_id: "source-1",
      status,
      title,
      type,
      updated_at: new Date("2026-01-01T00:00:00Z"),
    })),
    ensureProfile: vi.fn(),
    findActiveSourceByFingerprint: vi.fn(async () => null),
    getDashboardSummary: vi.fn(async () => ({
      collections: [],
      defaultThread: null,
      ingestion: {
        failedCount: 0,
        latestActivity: null,
        processingCount: 0,
        queuedCount: 0,
      },
      sources: [],
      tags: [],
    })),
    getDefaultChatThread: vi.fn(async () => null),
    getSourceForOwner: vi.fn(async (): Promise<KnowledgeSourceRecord> => ({
      createdAt: new Date("2026-01-01T00:00:00Z"),
      deletedAt: null,
      fingerprint: "note-1",
      id: "source-1",
      metadata: { body_hash: "old-hash", note_id: "note-1" },
      status: "ready",
      title: "Note",
      type: "note",
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      userId: "user-1",
    })),
    listKnowledgeSources: vi.fn(async () => ({ items: [], next_cursor: null })),
    getSourceDetail: vi.fn(async () => null),
    listCollections: vi.fn(async () => []),
    createCollection: vi.fn(async ({ name }) => ({
      collection_id: "collection-1",
      name,
      source_count: 0,
    })),
    addSourceToCollection: vi.fn(),
    listTags: vi.fn(async () => []),
    createTag: vi.fn(async ({ name }) => ({
      name,
      source_count: 0,
      tag_id: "tag-1",
    })),
    addTagToSource: vi.fn(),
    recordAnswerCitations: vi.fn(async ({ citations }) =>
      citations.map((citation: AnswerCitationInput, index: number) => ({
        chunk_hash_snapshot: citation.chunkHashSnapshot,
        chunk_position_snapshot: citation.chunkPositionSnapshot,
        citation_id: `citation-${index + 1}`,
        content_version_snapshot: citation.contentVersionSnapshot,
        quote: citation.quote,
        rank: citation.rank,
        source_content_id_snapshot: citation.sourceContentIdSnapshot,
        source_id_snapshot: citation.sourceIdSnapshot,
        source_title_snapshot: citation.sourceTitleSnapshot,
        source_type_snapshot: citation.sourceTypeSnapshot,
      })),
    ),
    recordChatMessage: vi.fn(async () => ({
      createdAt: new Date("2026-01-01T00:00:00Z"),
      messageId: "message-1",
    })),
    recordExtractedContent: vi.fn(async () => ({
      contentId: "content-1",
      version: 1,
    })),
    recordRetrievalRun: vi.fn(async ({ results }) => ({
      retrievalRunId: "retrieval-1",
      selectedChunks: results,
    })),
    softDeleteSource: vi.fn(),
    replaceActiveChunks: vi.fn(async () => ({
      activeChunkIds: ["chunk-1"],
      inactivePreviousContentId: null,
    })),
    retrieveOwnedChunks: vi.fn(async () => []),
    updateIngestionJob: vi.fn(),
    updateKnowledgeSourceDetails: vi.fn(),
    updateSourceStatus: vi.fn(),
  };
}

function createEmbeddings() {
  return {
    embed: vi.fn(async () => Array(1536).fill(0.1)),
    embedMany: vi.fn(async (input: string[]) =>
      input.map(() => Array(1536).fill(0.1)),
    ),
  };
}

const owner = { userId: "user-1" };

describe("thin knowledge loop use cases", () => {
  it("saves and processes a text note inline", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();

    const result = await saveTextNote({
      body: "Retrieval quality notes",
      embeddings,
      owner,
      repository,
      title: "Retrieval",
    });

    expect(result).toMatchObject({ ok: true, status: "ready" });
    expect(repository.updateSourceStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ready" }),
    );
    expect(repository.replaceActiveChunks).toHaveBeenCalledWith(
      expect.objectContaining({
        embeddings: [expect.objectContaining({ dimensions: 1536 })],
      }),
    );
  });

  it("saves and processes a text document inline", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();

    const result = await saveTextDocument({
      byteSize: 42,
      embeddings,
      fileName: "research.md",
      mimeType: "text/markdown",
      owner,
      repository,
      text: "# Research\n\nRetrieval works from Markdown documents.",
    });

    expect(result).toMatchObject({ ok: true, status: "ready" });
    expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          file_name: "research.md",
          mime_type: "text/markdown",
          storage_bucket: "inline-upload",
        }),
        title: "research.md",
        type: "document",
      }),
    );
    expect(repository.recordExtractedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "# Research\n\nRetrieval works from Markdown documents.",
      }),
    );
  });

  it("fetches, extracts, and processes a URL source", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    const fetcher = vi.fn(
      async () =>
        new Response(
          "<html><head><title>Research page</title></head><body><h1>Retrieval</h1><script>ignored()</script><p>URL knowledge works.</p></body></html>",
          { headers: { "content-type": "text/html" } },
        ),
    );

    const result = await saveUrlSource({
      embeddings,
      fetcher,
      owner,
      repository,
      url: "HTTPS://Example.com/research/#section",
    });

    expect(result).toMatchObject({ ok: true, status: "ready" });
    expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          canonical_url: "https://example.com/research",
          original_url: "HTTPS://Example.com/research/#section",
        }),
        title: "Research page",
        type: "url",
      }),
    );
    expect(repository.recordExtractedContent).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Retrieval URL knowledge works." }),
    );
  });

  it("blocks local URL ingestion before fetching", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    const fetcher = vi.fn();

    await expect(
      saveUrlSource({
        embeddings,
        fetcher,
        owner,
        repository,
        url: "http://127.0.0.1/private",
      }),
    ).rejects.toThrow("This URL host cannot be ingested");
    expect(fetcher).not.toHaveBeenCalled();
    expect(repository.createKnowledgeSource).not.toHaveBeenCalled();
  });
  it("rejects unsupported document uploads before source creation", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();

    await expect(
      saveTextDocument({
        byteSize: 42,
        embeddings,
        fileName: "slides.pdf",
        mimeType: "application/pdf",
        owner,
        repository,
        text: "PDF bytes are not parsed in deadline mode.",
      }),
    ).rejects.toThrow("Upload a plain text or Markdown file");
    expect(repository.createKnowledgeSource).not.toHaveBeenCalled();
  });
  it("updates and reprocesses an owned note source", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();

    const result = await updateTextNote({
      body: "Updated retrieval notes",
      embeddings,
      owner,
      repository,
      sourceId: "source-1",
      title: "Updated title",
    });

    expect(result).toMatchObject({ ok: true, sourceId: "source-1" });
    expect(repository.updateKnowledgeSourceDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ note_id: "note-1" }),
        sourceId: "source-1",
        status: "processing",
        title: "Updated title",
      }),
    );
    expect(repository.recordExtractedContent).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Updated retrieval notes" }),
    );
    expect(repository.replaceActiveChunks).toHaveBeenCalledWith(
      expect.objectContaining({ contentId: "content-1" }),
    );
  });

  it("rejects note edits when the source is not owned", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    vi.mocked(repository.getSourceForOwner).mockResolvedValueOnce(null);

    await expect(
      updateTextNote({
        body: "Attempted edit",
        embeddings,
        owner,
        repository,
        sourceId: "other-source",
      }),
    ).rejects.toThrow("Source not found");
    expect(repository.updateKnowledgeSourceDetails).not.toHaveBeenCalled();
  });

  it("records a failed source without leaking note text when processing fails", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    vi.mocked(repository.replaceActiveChunks).mockRejectedValueOnce(
      new Error("provider failed"),
    );

    const result = await saveTextNote({
      body: "Sensitive private source text",
      embeddings,
      owner,
      repository,
    });

    expect(result).toMatchObject({ ok: false });
    expect(repository.updateIngestionJob).toHaveBeenCalledWith(
      expect.objectContaining({
        lastErrorMessage: "Inline note processing failed",
        status: "failed_retryable",
      }),
    );
  });

  it("archives an owned source with a soft delete", async () => {
    const repository = createRepository();

    const result = await archiveSource({
      owner,
      repository,
      sourceId: "source-1",
    });

    expect(result).toMatchObject({ ok: true });
    expect(repository.softDeleteSource).toHaveBeenCalledWith({
      owner,
      sourceId: "source-1",
    });
  });

  it("retries a failed source from its active extracted text", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    vi.mocked(repository.getSourceDetail).mockResolvedValueOnce({
      active_content_text: "Retry this extracted source text.",
      collections: [],
      source: {
        active_content_text: "Retry this extracted source text.",
        created_at: new Date("2026-01-01T00:00:00Z"),
        fingerprint: "source-1",
        metadata: { note_id: "note-1", body_hash: "hash" },
        source_id: "source-1",
        status: "failed",
        title: "Retry source",
        type: "note",
        updated_at: new Date("2026-01-01T00:00:00Z"),
      },
      tags: [],
    });

    const result = await retrySourceIngestion({
      embeddings,
      owner,
      repository,
      sourceId: "source-1",
    });

    expect(result).toMatchObject({ ok: true, status: "ready" });
    expect(repository.recordExtractedContent).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Retry this extracted source text." }),
    );
    expect(repository.updateIngestionJob).toHaveBeenCalledWith(
      expect.objectContaining({ status: "succeeded" }),
    );
  });
  it("refuses unsupported answers without citations", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    const answers: AnswerGateway = {
      answer: vi.fn(async function* () {
        yield "unused";
      }),
    };

    const result = await answerQuestion({
      answers,
      embeddings,
      owner,
      question: "What did I save about billing?",
      repository,
    });

    expect(result.answer).toContain("does not contain enough information");
    expect(result.citations).toEqual([]);
    expect(repository.recordAnswerCitations).toHaveBeenCalledWith(
      expect.objectContaining({ citations: [] }),
    );
    expect(answers.answer).not.toHaveBeenCalled();
  });

  it("records citations for supported retrieved chunks", async () => {
    const chunk: RetrievalChunkDto = {
      chunk_hash: "chunk-hash",
      chunk_id: "chunk-1",
      chunk_position: 1,
      content_version: 1,
      score: 0.9,
      source_content_id: "content-1",
      source_fingerprint: "source-1",
      source_id: "source-1",
      source_title: "Retrieval",
      source_type: "note",
      text: `${"Retrieval should use owned ready sources. ".repeat(10)}\n\nMore context from the saved note.`,
    };
    const repository = createRepository();
    const embeddings = createEmbeddings();
    vi.mocked(repository.retrieveOwnedChunks).mockResolvedValueOnce([chunk]);
    const answers: AnswerGateway = {
      answer: vi.fn(async function* () {
        yield "Use owned ready sources [1].";
      }),
    };

    const result = await answerQuestion({
      answers,
      embeddings,
      owner,
      filters: { collectionId: "collection-1", tagId: "tag-1" },
      question: "What should retrieval use?",
      repository,
    });

    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]?.source_title_snapshot).toBe("Retrieval");
    expect(result.citations[0]?.quote).not.toContain("\n");
    expect(result.citations[0]?.quote).toHaveLength(280);
    expect(result.citations[0]?.quote).toMatch(/\.\.\.$/);
    expect(repository.retrieveOwnedChunks).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: { collectionId: "collection-1", tagId: "tag-1" },
      }),
    );
    expect(repository.recordRetrievalRun).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: {
          collection_id: "collection-1",
          source_status: "ready",
          tag_id: "tag-1",
        },
        owner,
        results: [expect.objectContaining({ chunkId: "chunk-1", rank: 1 })],
      }),
    );
  });
});
