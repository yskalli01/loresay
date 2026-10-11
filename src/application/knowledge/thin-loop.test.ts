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
  purgeArchivedSource,
  saveTextDocument,
  saveTextNote,
  saveUrlSource,
  retrySourceIngestion,
  updateTextDocument,
  updateTextNote,
  updateUrlSource,
  type AnswerGateway,
} from "./thin-loop";

function sourceRecord(
  overrides: Partial<KnowledgeSourceRecord> = {},
): KnowledgeSourceRecord {
  return {
    createdAt: new Date("2026-01-01T00:00:00Z"),
    deletedAt: null,
    purgedAt: null,
    fingerprint: "note-1",
    id: "source-1",
    metadata: { body_hash: "old-hash", note_id: "note-1" },
    status: "ready",
    title: "Note",
    type: "note",
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    userId: "user-1",
    ...overrides,
  };
}

function createRepository(): KnowledgeRepository {
  return {
    assertCollectionAndSourceShareOwner: vi.fn(),
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
    getProfile: vi.fn(async () => ({
      avatarStoragePath: null,
      avatarUpdatedAt: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      displayName: null,
      id: "user-1",
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    })),
    updateProfile: vi.fn(async ({ displayName }) => ({
      avatarStoragePath: null,
      avatarUpdatedAt: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      displayName,
      id: "user-1",
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    })),
    updateProfileAvatar: vi.fn(
      async ({ avatarStoragePath, avatarUpdatedAt }) => ({
        avatarStoragePath,
        avatarUpdatedAt,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        displayName: null,
        id: "user-1",
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      }),
    ),
    deleteProfile: vi.fn(),
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
      metrics: {
        noteSources: 0,
        totalSources: 0,
        unsortedSources: 0,
      },
      sources: [],
    })),
    getDefaultChatThread: vi.fn(async () => null),
    getSourceForOwner: vi.fn(async () => sourceRecord()),
    listKnowledgeSources: vi.fn(async () => ({
      items: [],
      next_cursor: null,
      total: 0,
    })),
    listArchivedSources: vi.fn(async () => []),
    exportOwnedKnowledge: vi.fn(async () => ({
      answer_citations: [],
      chat_messages: [],
      chat_threads: [],
      collection_sources: [],
      collections: [],
      exported_at: new Date("2026-01-01T00:00:00Z"),
      retrieval_results: [],
      retrieval_runs: [],
      sources: [],
    })),
    purgeArchivedSource: vi.fn(async () => ({
      purgedAt: new Date("2026-01-01T00:00:00Z"),
      sourceId: "source-1",
    })),
    getSourceDetail: vi.fn(async () => null),
    listSourceCitations: vi.fn(async () => []),
    listCollections: vi.fn(async () => []),
    createCollection: vi.fn(async ({ imageUrl, name }) => ({
      collection_id: "collection-1",
      created_at: new Date("2026-01-01T00:00:00Z"),
      image_url: imageUrl ?? null,
      name,
      source_count: 0,
      updated_at: new Date("2026-01-01T00:00:00Z"),
    })),
    deleteCollection: vi.fn(),
    deleteCollections: vi.fn(),
    getCollectionDetail: vi.fn(async () => null),
    updateCollection: vi.fn(async ({ imageUrl, name }) => ({
      collection_id: "collection-1",
      created_at: new Date("2026-01-01T00:00:00Z"),
      image_url: imageUrl,
      name,
      source_count: 0,
      updated_at: new Date("2026-01-01T00:00:00Z"),
    })),
    addSourceToCollection: vi.fn(),
    removeSourceFromCollection: vi.fn(),
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
    model: "test-embedding-model",
    provider: "test",
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
        embeddings: [
          expect.objectContaining({
            dimensions: 1536,
            model: "test-embedding-model",
            provider: "test",
          }),
        ],
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
        title: "Attempted edit",
      }),
    ).rejects.toThrow("Source not found");
    expect(repository.updateKnowledgeSourceDetails).not.toHaveBeenCalled();
  });

  it("renames a document without reprocessing its content", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    vi.mocked(repository.getSourceForOwner).mockResolvedValueOnce(
      sourceRecord({
        fingerprint: "file-hash",
        metadata: {
          byte_size: 42,
          file_hash: "file-hash",
          file_name: "research.md",
          mime_type: "text/markdown",
          storage_bucket: "inline-upload",
          storage_path: "inline-upload/file-hash/research.md",
        },
        title: "research.md",
        type: "document",
      }),
    );

    const result = await updateTextDocument({
      embeddings,
      owner,
      repository,
      sourceId: "source-1",
      title: "Research archive",
    });

    expect(result).toMatchObject({ ok: true, reprocessed: false });
    expect(repository.updateKnowledgeSourceDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: "file-hash",
        status: "ready",
        title: "Research archive",
      }),
    );
    expect(repository.recordExtractedContent).not.toHaveBeenCalled();
  });

  it("replaces and reprocesses a document on the same source", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    vi.mocked(repository.getSourceForOwner).mockResolvedValueOnce(
      sourceRecord({
        fingerprint: "old-file-hash",
        metadata: {
          byte_size: 12,
          file_hash: "old-file-hash",
          file_name: "old.txt",
          mime_type: "text/plain",
          storage_bucket: "inline-upload",
          storage_path: "inline-upload/old-file-hash/old.txt",
        },
        title: "Old document",
        type: "document",
      }),
    );

    const result = await updateTextDocument({
      embeddings,
      owner,
      replacement: {
        byteSize: 24,
        fileName: "replacement.md",
        mimeType: "text/markdown",
        text: "# Replacement\n\nNew searchable content.",
      },
      repository,
      sourceId: "source-1",
      title: "Updated document",
    });

    expect(result).toMatchObject({ ok: true, reprocessed: true });
    expect(repository.findActiveSourceByFingerprint).toHaveBeenCalledWith(
      expect.objectContaining({ type: "document" }),
    );
    expect(repository.updateKnowledgeSourceDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: expect.any(String),
        metadata: expect.objectContaining({
          file_name: "replacement.md",
          mime_type: "text/markdown",
        }),
        status: "processing",
        title: "Updated document",
      }),
    );
    expect(repository.recordExtractedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "# Replacement\n\nNew searchable content.",
      }),
    );
  });

  it("renames a URL without fetching when its canonical address is unchanged", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    const fetcher = vi.fn();
    vi.mocked(repository.getSourceForOwner).mockResolvedValueOnce(
      sourceRecord({
        fingerprint: "url-hash",
        metadata: {
          canonical_url: "https://example.com/research",
          original_url: "https://example.com/research",
          url_hash: "url-hash",
        },
        title: "Research page",
        type: "url",
      }),
    );

    const result = await updateUrlSource({
      embeddings,
      fetcher,
      owner,
      repository,
      sourceId: "source-1",
      title: "Renamed research",
      url: "HTTPS://Example.com/research/#section",
    });

    expect(result).toMatchObject({ ok: true, reprocessed: false });
    expect(fetcher).not.toHaveBeenCalled();
    expect(repository.recordExtractedContent).not.toHaveBeenCalled();
    expect(repository.updateKnowledgeSourceDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: "url-hash",
        title: "Renamed research",
      }),
    );
  });

  it("fetches and reprocesses a changed URL", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    const fetcher = vi.fn(
      async () =>
        new Response(
          "<html><head><title>New page</title></head><body><p>Fresh URL content.</p></body></html>",
          { headers: { "content-type": "text/html" } },
        ),
    );
    vi.mocked(repository.getSourceForOwner).mockResolvedValueOnce(
      sourceRecord({
        fingerprint: "old-url-hash",
        metadata: {
          canonical_url: "https://example.com/old",
          original_url: "https://example.com/old",
          url_hash: "old-url-hash",
        },
        title: "Old page",
        type: "url",
      }),
    );

    const result = await updateUrlSource({
      embeddings,
      fetcher,
      owner,
      repository,
      sourceId: "source-1",
      title: "New research page",
      url: "https://example.com/new",
    });

    expect(result).toMatchObject({ ok: true, reprocessed: true });
    expect(fetcher).toHaveBeenCalledWith(
      "https://example.com/new",
      expect.any(Object),
    );
    expect(repository.updateKnowledgeSourceDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: expect.any(String),
        metadata: expect.objectContaining({
          canonical_url: "https://example.com/new",
        }),
        status: "processing",
        title: "New research page",
      }),
    );
    expect(repository.recordExtractedContent).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Fresh URL content." }),
    );
  });

  it("rejects duplicate document replacements before changing the source", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    vi.mocked(repository.getSourceForOwner).mockResolvedValueOnce(
      sourceRecord({
        fingerprint: "old-file-hash",
        metadata: {
          byte_size: 12,
          file_hash: "old-file-hash",
          file_name: "old.txt",
          mime_type: "text/plain",
          storage_bucket: "inline-upload",
          storage_path: "inline-upload/old-file-hash/old.txt",
        },
        type: "document",
      }),
    );
    vi.mocked(repository.findActiveSourceByFingerprint).mockResolvedValueOnce(
      sourceRecord({ id: "duplicate-source", type: "document" }),
    );

    await expect(
      updateTextDocument({
        embeddings,
        owner,
        replacement: {
          byteSize: 14,
          fileName: "duplicate.txt",
          mimeType: "text/plain",
          text: "Duplicate text",
        },
        repository,
        sourceId: "source-1",
        title: "Duplicate",
      }),
    ).rejects.toThrow("An active source with this fingerprint already exists");
    expect(repository.updateKnowledgeSourceDetails).not.toHaveBeenCalled();
  });

  it("rejects deleted sources and blocked replacement URLs", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    vi.mocked(repository.getSourceForOwner).mockResolvedValueOnce(
      sourceRecord({ deletedAt: new Date("2026-02-01T00:00:00Z") }),
    );

    await expect(
      updateTextNote({
        body: "Updated",
        embeddings,
        owner,
        repository,
        sourceId: "source-1",
        title: "Updated note",
      }),
    ).rejects.toThrow("Source is deleted");

    await expect(
      updateUrlSource({
        embeddings,
        owner,
        repository,
        sourceId: "source-1",
        title: "Blocked URL",
        url: "http://127.0.0.1/private",
      }),
    ).rejects.toThrow("This URL host cannot be ingested");
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

  it("purges an archived source after archive state is confirmed", async () => {
    const repository = createRepository();
    vi.mocked(repository.getSourceForOwner).mockResolvedValueOnce({
      createdAt: new Date("2026-01-01T00:00:00Z"),
      deletedAt: new Date("2026-01-02T00:00:00Z"),
      purgedAt: null,
      fingerprint: "note-1",
      id: "source-1",
      metadata: { body_hash: "old-hash", note_id: "note-1" },
      status: "deleted",
      title: "Note",
      type: "note",
      updatedAt: new Date("2026-01-02T00:00:00Z"),
      userId: "user-1",
    });

    const result = await purgeArchivedSource({
      owner,
      repository,
      sourceId: "source-1",
    });

    expect(result).toMatchObject({ ok: true });
    expect(repository.purgeArchivedSource).toHaveBeenCalledWith({
      owner,
      sourceId: "source-1",
    });
  });

  it("refuses to purge an active source", async () => {
    const repository = createRepository();

    await expect(
      purgeArchivedSource({
        owner,
        repository,
        sourceId: "source-1",
      }),
    ).rejects.toThrow("Archive this source before purging it");
    expect(repository.purgeArchivedSource).not.toHaveBeenCalled();
  });

  it("reprocesses a ready source from its active extracted text", async () => {
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
        status: "ready",
        title: "Retry source",
        type: "note",
        updated_at: new Date("2026-01-01T00:00:00Z"),
      },
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

  it("refuses to reprocess a source without active extracted text", async () => {
    const repository = createRepository();
    const embeddings = createEmbeddings();
    vi.mocked(repository.getSourceDetail).mockResolvedValueOnce({
      active_content_text: null,
      collections: [],
      source: {
        active_content_text: null,
        created_at: new Date("2026-01-01T00:00:00Z"),
        fingerprint: "source-1",
        metadata: { note_id: "note-1", body_hash: "hash" },
        source_id: "source-1",
        status: "processing",
        title: "Processing source",
        type: "note",
        updated_at: new Date("2026-01-01T00:00:00Z"),
      },
    });

    await expect(
      retrySourceIngestion({
        embeddings,
        owner,
        repository,
        sourceId: "source-1",
      }),
    ).rejects.toThrow("Only ready or failed sources can be reprocessed");
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

    expect(result.answer).toContain(
      "could not find enough relevant saved knowledge",
    );
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
      filters: { collectionId: "collection-1" },
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
        filters: { collectionId: "collection-1" },
      }),
    );
    expect(repository.recordRetrievalRun).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: {
          collection_id: "collection-1",
          source_status: "ready",
        },
        owner,
        results: [expect.objectContaining({ chunkId: "chunk-1", rank: 1 })],
      }),
    );
  });
});
