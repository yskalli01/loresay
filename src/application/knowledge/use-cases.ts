import {
  assertCitationRanks,
  assertKnownChatRole,
  assertKnownIngestionJobStatus,
  assertKnownSourceType,
  assertRetrievalRanks,
  assertSourceMetadata,
  assertWithinTextLimit,
  deriveSourceFingerprint,
  deriveSourceTitle,
  initialSourceStatus,
  knowledgeLimits,
  type ChatRole,
  type IngestionJobStatus,
  type JsonObject,
  type KnowledgeSourceId,
  type SourceType,
} from "@/domain/knowledge";
import { invariant } from "@/domain/knowledge/errors";

import type {
  AnswerCitationInput,
  ContentChunkInput,
  EmbeddingInput,
  KnowledgeRepository,
  OwnerContext,
  RetrievalResultInput,
  SourceListFilters,
} from "./repositories";

export type CreateKnowledgeSourceInput = {
  type: string;
  title?: string | null;
  metadata: JsonObject;
  noteBody?: string;
};

export async function createKnowledgeSource(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: CreateKnowledgeSourceInput,
) {
  assertKnownSourceType(input.type);
  assertSourceMetadata(input.type, input.metadata);

  const fingerprint = deriveSourceFingerprint(input.type, input.metadata);
  const title = deriveSourceTitle(
    input.type,
    input.metadata,
    input.title,
    input.noteBody,
  );
  assertWithinTextLimit("Source title", title, knowledgeLimits.title);

  const existingSource = await repository.findActiveSourceByFingerprint({
    owner,
    type: input.type,
    fingerprint,
  });
  invariant(
    existingSource === null,
    "An active source with this fingerprint already exists",
    "duplicate_active_source",
  );

  return repository.createKnowledgeSource({
    owner,
    type: input.type,
    title,
    status: initialSourceStatus(input.type),
    fingerprint,
    metadata: input.metadata,
  });
}

export async function recordExtractedContent(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: {
    sourceId: KnowledgeSourceId;
    text: string;
    contentHash: string;
  },
) {
  assertWithinTextLimit(
    "Extracted text",
    input.text,
    knowledgeLimits.sourceText,
  );

  const source = await repository.getSourceForOwner({
    owner,
    sourceId: input.sourceId,
  });
  invariant(source !== null, "Source not found", "source_not_found");
  invariant(source.deletedAt === null, "Source is deleted", "source_deleted");

  return repository.recordExtractedContent({
    owner,
    sourceId: input.sourceId,
    text: input.text,
    contentHash: input.contentHash,
  });
}

export async function replaceActiveChunks(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: {
    contentId: string;
    chunks: ContentChunkInput[];
    embeddings: EmbeddingInput[];
    expectedDimensions: number;
  },
) {
  invariant(
    input.chunks.length > 0,
    "At least one chunk is required",
    "no_chunks",
  );
  invariant(
    input.chunks.length <= knowledgeLimits.chunksPerSource,
    "A source can have at most 2000 chunks",
    "chunk_limit_exceeded",
  );

  input.chunks.forEach((chunk) => {
    assertWithinTextLimit("Chunk text", chunk.text, knowledgeLimits.chunkText);
    invariant(
      chunk.tokenCount >= 0,
      "Chunk token count cannot be negative",
      "invalid_chunk_token_count",
    );
  });

  input.embeddings.forEach((embedding) => {
    invariant(
      embedding.dimensions === input.expectedDimensions,
      "Embedding dimensions do not match the configured model",
      "embedding_dimensions_mismatch",
    );
    invariant(
      embedding.embedding.length === input.expectedDimensions,
      "Embedding vector length does not match its dimensions",
      "embedding_vector_length_mismatch",
    );
  });

  return repository.replaceActiveChunks({
    owner,
    contentId: input.contentId,
    chunks: input.chunks,
    embeddings: input.embeddings,
  });
}

export async function createIngestionJob(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: {
    sourceId: KnowledgeSourceId;
    status: string;
  },
) {
  assertKnownIngestionJobStatus(input.status);

  return repository.createIngestionJob({
    owner,
    sourceId: input.sourceId,
    status: input.status,
  });
}

export async function listKnowledgeSources(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: {
    cursor?: string;
    limit?: number;
    filters?: SourceListFilters;
  } = {},
) {
  const limit = input.limit ?? 50;
  invariant(
    limit > 0 && limit <= 100,
    "Invalid page size",
    "invalid_page_size",
  );

  return repository.listKnowledgeSources({
    owner,
    cursor: input.cursor,
    limit,
    filters: input.filters ?? {},
  });
}

export async function assertCollectionSourceLink(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { collectionId: string; sourceId: KnowledgeSourceId },
) {
  return repository.assertCollectionAndSourceShareOwner({ owner, ...input });
}

export async function assertSourceTagLink(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { tagId: string; sourceId: KnowledgeSourceId },
) {
  return repository.assertTagAndSourceShareOwner({ owner, ...input });
}

export async function listCollections(
  repository: KnowledgeRepository,
  owner: OwnerContext,
) {
  return repository.listCollections({ owner });
}

export async function createCollection(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { name: string },
) {
  const name = input.name.trim();
  assertWithinTextLimit("Collection name", name, knowledgeLimits.title);
  invariant(
    name.length > 0,
    "Collection name is required",
    "collection_name_required",
  );

  return repository.createCollection({ owner, name });
}

export async function addSourceToCollection(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { collectionId: string; sourceId: KnowledgeSourceId },
) {
  await assertCollectionSourceLink(repository, owner, input);
  await repository.addSourceToCollection({ owner, ...input });
}

export async function listTags(
  repository: KnowledgeRepository,
  owner: OwnerContext,
) {
  return repository.listTags({ owner });
}

export async function createTag(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { name: string },
) {
  const name = input.name.trim();
  assertWithinTextLimit("Tag name", name, knowledgeLimits.tagName);
  invariant(name.length > 0, "Tag name is required", "tag_name_required");

  return repository.createTag({ owner, name });
}

export async function addTagToSource(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { tagId: string; sourceId: KnowledgeSourceId },
) {
  await assertSourceTagLink(repository, owner, input);
  await repository.addTagToSource({ owner, ...input });
}
export async function createChatThread(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { title?: string | null } = {},
) {
  const title = input.title?.trim() || "New chat";
  assertWithinTextLimit("Chat title", title, knowledgeLimits.title);

  return repository.createChatThread({ owner, title });
}

export async function recordChatMessage(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: {
    threadId: string;
    role: string;
    content: string;
  },
) {
  assertKnownChatRole(input.role);
  assertWithinTextLimit(
    "Chat message",
    input.content,
    knowledgeLimits.chatMessageText,
  );

  return repository.recordChatMessage({
    owner,
    threadId: input.threadId,
    role: input.role,
    content: input.content,
  });
}

export async function recordRetrievalRun(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: {
    assistantMessageId: string;
    query: string;
    filters?: JsonObject;
    promptContextHash: string;
    results: RetrievalResultInput[];
  },
) {
  assertRetrievalRanks(input.results.map((result) => result.rank));

  return repository.recordRetrievalRun({
    owner,
    assistantMessageId: input.assistantMessageId,
    query: input.query,
    filters: input.filters ?? {},
    promptContextHash: input.promptContextHash,
    results: input.results,
  });
}

export async function recordAnswerCitations(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: {
    assistantMessageId: string;
    citations: AnswerCitationInput[];
  },
) {
  assertCitationRanks(input.citations.map((citation) => citation.rank));
  input.citations.forEach((citation) => {
    if (citation.quote !== null) {
      assertWithinTextLimit(
        "Citation quote",
        citation.quote,
        knowledgeLimits.citationQuote,
      );
    }
  });

  return repository.recordAnswerCitations({
    owner,
    assistantMessageId: input.assistantMessageId,
    citations: input.citations,
  });
}

export type {
  AnswerCitationInput,
  ChatRole,
  ContentChunkInput,
  EmbeddingInput,
  IngestionJobStatus,
  RetrievalResultInput,
  SourceListFilters,
  SourceType,
};
