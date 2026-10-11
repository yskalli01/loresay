import { describe, expect, it, vi } from "vitest";

import { KnowledgeDomainError } from "@/domain/knowledge";

import {
  createChatThread,
  createCollection,
  createKnowledgeSource,
  deleteCollections,
  removeSourceFromCollection,
  recordAnswerCitations,
  recordChatMessage,
  recordExtractedContent,
  replaceActiveChunks,
} from "./use-cases";
import type { KnowledgeRepository } from "./repositories";

type RecordAnswerCitationsInput = Parameters<
  KnowledgeRepository["recordAnswerCitations"]
>[0];

const activeNoteSource = {
  id: "source-1",
  userId: "user-1",
  type: "note",
  title: "Note",
  status: "draft",
  fingerprint: "note-1",
  metadata: {},
  deletedAt: null,
  purgedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
} as const;

function createRepository(): KnowledgeRepository {
  return {
    assertCollectionAndSourceShareOwner: vi.fn(),
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
    createChatThread: vi.fn(async ({ title }) => ({
      threadId: "thread-1",
      title,
    })),
    createIngestionJob: vi.fn(async ({ status }) => ({
      jobId: "job-1",
      status,
    })),
    createKnowledgeSource: vi.fn(async ({ type, title, status }) => ({
      source_id: "source-1",
      type,
      title,
      status,
      created_at: new Date("2026-01-01T00:00:00Z"),
      updated_at: new Date("2026-01-01T00:00:00Z"),
    })),
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
    getSourceForOwner: vi.fn(async () => activeNoteSource),
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
    recordAnswerCitations: vi.fn(
      async ({ citations }: RecordAnswerCitationsInput) =>
        citations.map((citation, index) => ({
          citation_id: `citation-${index + 1}`,
          source_id_snapshot: citation.sourceIdSnapshot,
          source_type_snapshot: citation.sourceTypeSnapshot,
          source_title_snapshot: citation.sourceTitleSnapshot,
          source_content_id_snapshot: citation.sourceContentIdSnapshot,
          content_version_snapshot: citation.contentVersionSnapshot,
          chunk_position_snapshot: citation.chunkPositionSnapshot,
          chunk_hash_snapshot: citation.chunkHashSnapshot,
          quote: citation.quote,
          rank: citation.rank,
        })),
    ),
    recordChatMessage: vi.fn(async () => ({
      messageId: "message-1",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    })),
    recordExtractedContent: vi.fn(async () => ({
      contentId: "content-1",
      version: 1,
    })),
    recordRetrievalRun: vi.fn(async ({ results }) => ({
      retrievalRunId: "retrieval-1",
      selectedChunks: results,
    })),
    retrieveOwnedChunks: vi.fn(async () => []),
    softDeleteSource: vi.fn(),
    replaceActiveChunks: vi.fn(async () => ({
      activeChunkIds: ["chunk-1"],
      inactivePreviousContentId: null,
    })),
    updateIngestionJob: vi.fn(),
    updateKnowledgeSourceDetails: vi.fn(),
    updateSourceStatus: vi.fn(),
  };
}

const owner = { userId: "user-1" };

describe("knowledge use cases", () => {
  it("creates a source from session ownership and derived metadata", async () => {
    const repository = createRepository();

    const result = await createKnowledgeSource(repository, owner, {
      type: "note",
      metadata: { note_id: "note-1", body_hash: "body-hash" },
      noteBody: "A useful note",
    });

    expect(result).toMatchObject({
      source_id: "source-1",
      title: "A useful note",
      status: "draft",
    });
    expect(repository.createKnowledgeSource).toHaveBeenCalledWith(
      expect.objectContaining({
        owner,
        fingerprint: "note-1",
        status: "draft",
      }),
    );
  });

  it("rejects duplicate active source fingerprints", async () => {
    const repository = createRepository();
    vi.mocked(repository.findActiveSourceByFingerprint).mockResolvedValueOnce({
      id: "existing-source",
      userId: "user-1",
      type: "note",
      title: "Existing",
      status: "ready",
      fingerprint: "note-1",
      metadata: {},
      deletedAt: null,
      purgedAt: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });

    await expect(
      createKnowledgeSource(repository, owner, {
        type: "note",
        metadata: { note_id: "note-1", body_hash: "body-hash" },
      }),
    ).rejects.toThrow("An active source with this fingerprint already exists");
  });

  it("refuses to record content for deleted sources", async () => {
    const repository = createRepository();
    vi.mocked(repository.getSourceForOwner).mockResolvedValueOnce({
      id: "source-1",
      userId: "user-1",
      type: "note",
      title: "Deleted",
      status: "deleted",
      fingerprint: "note-1",
      metadata: {},
      deletedAt: new Date("2026-01-01T00:00:00Z"),
      purgedAt: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });

    await expect(
      recordExtractedContent(repository, owner, {
        sourceId: "source-1",
        text: "content",
        contentHash: "hash",
      }),
    ).rejects.toThrow("Source is deleted");
  });

  it("validates chunk and embedding limits before active replacement", async () => {
    const repository = createRepository();

    await expect(
      replaceActiveChunks(repository, owner, {
        contentId: "content-1",
        chunks: [{ text: "chunk", tokenCount: 1, contentHash: "hash" }],
        expectedDimensions: 1536,
        embeddings: [
          {
            chunkPosition: 1,
            provider: "openai",
            model: "text-embedding-3-small",
            dimensions: 3,
            embedding: [0.1, 0.2, 0.3],
            contentHash: "hash",
          },
        ],
      }),
    ).rejects.toThrow("Embedding dimensions do not match");
  });

  it("validates collection image URLs before saving", async () => {
    const repository = createRepository();

    await expect(
      createCollection(repository, owner, {
        imageUrl: "ftp://example.com/image.png",
        name: "Research",
      }),
    ).rejects.toThrow("Use an HTTP or HTTPS image URL");

    await createCollection(repository, owner, {
      imageUrl: " https://example.com/image.png ",
      name: " Research ",
    });

    expect(repository.createCollection).toHaveBeenCalledWith({
      description: null,
      imageUrl: "https://example.com/image.png",
      name: "Research",
      owner,
    });

    await createCollection(repository, owner, {
      imageUrl: "user-1/123e4567-e89b-12d3-a456-426614174000.webp",
      name: "Private image",
    });

    expect(repository.createCollection).toHaveBeenLastCalledWith({
      description: null,
      imageUrl: "user-1/123e4567-e89b-12d3-a456-426614174000.webp",
      name: "Private image",
      owner,
    });
  });

  it("requires a selection for bulk collection deletion", async () => {
    const repository = createRepository();

    await expect(
      deleteCollections(repository, owner, { collectionIds: [" "] }),
    ).rejects.toThrow("Select at least one collection");
    expect(repository.deleteCollections).not.toHaveBeenCalled();
  });

  it("removes a source only after validating collection ownership", async () => {
    const repository = createRepository();

    await removeSourceFromCollection(repository, owner, {
      collectionId: "collection-1",
      sourceId: "source-1",
    });

    expect(repository.assertCollectionAndSourceShareOwner).toHaveBeenCalledWith(
      {
        collectionId: "collection-1",
        owner,
        sourceId: "source-1",
      },
    );
    expect(repository.removeSourceFromCollection).toHaveBeenCalledWith({
      collectionId: "collection-1",
      owner,
      sourceId: "source-1",
    });
  });

  it("defaults chat titles and validates chat roles", async () => {
    const repository = createRepository();

    await expect(
      recordChatMessage(repository, owner, {
        threadId: "thread-1",
        role: "invalid-role",
        content: "hello",
      }),
    ).rejects.toThrow(KnowledgeDomainError);

    await createChatThread(repository, owner);

    expect(repository.createChatThread).toHaveBeenCalledWith({
      owner,
      title: "New chat",
    });
  });

  it("preserves citation snapshots and enforces citation rank rules", async () => {
    const repository = createRepository();

    await expect(
      recordAnswerCitations(repository, owner, {
        assistantMessageId: "message-1",
        citations: [
          {
            chunkId: "chunk-1",
            sourceIdSnapshot: "source-1",
            sourceTypeSnapshot: "note",
            sourceTitleSnapshot: "Note",
            sourceFingerprintSnapshot: "note-1",
            sourceContentIdSnapshot: "content-1",
            contentVersionSnapshot: 1,
            chunkPositionSnapshot: 1,
            chunkHashSnapshot: "chunk-hash",
            locationSnapshot: {},
            quote: "quote",
            rank: 1,
          },
          {
            chunkId: "chunk-2",
            sourceIdSnapshot: "source-1",
            sourceTypeSnapshot: "note",
            sourceTitleSnapshot: "Note",
            sourceFingerprintSnapshot: "note-1",
            sourceContentIdSnapshot: "content-1",
            contentVersionSnapshot: 1,
            chunkPositionSnapshot: 2,
            chunkHashSnapshot: "chunk-hash-2",
            locationSnapshot: {},
            quote: "quote",
            rank: 1,
          },
        ],
      }),
    ).rejects.toThrow("Citation ranks must be unique per answer");
  });
});
