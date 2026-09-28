import { describe, expect, it, vi } from "vitest";

import { KnowledgeDomainError } from "@/domain/knowledge";

import {
  createChatThread,
  createKnowledgeSource,
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
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
} as const;

function createRepository(): KnowledgeRepository {
  return {
    assertCollectionAndSourceShareOwner: vi.fn(),
    assertTagAndSourceShareOwner: vi.fn(),
    ensureProfile: vi.fn(),
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
      sources: [],
      tags: [],
    })),
    getDefaultChatThread: vi.fn(async () => null),
    getSourceForOwner: vi.fn(async () => activeNoteSource),
    listKnowledgeSources: vi.fn(async () => ({
      items: [],
      next_cursor: null,
    })),
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
