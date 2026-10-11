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
  KnowledgeDomainError,
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
  CollectionListFilters,
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
    offset?: number;
    filters?: SourceListFilters;
  } = {},
) {
  const limit = input.limit ?? 50;
  invariant(
    limit > 0 && limit <= 100,
    "Invalid page size",
    "invalid_page_size",
  );
  invariant(
    input.offset === undefined ||
      (input.offset >= 0 && Number.isInteger(input.offset)),
    "Invalid page offset",
    "invalid_page_offset",
  );

  return repository.listKnowledgeSources({
    owner,
    cursor: input.cursor,
    limit,
    offset: input.offset,
    filters: input.filters ?? {},
  });
}

export async function exportOwnedKnowledge(
  repository: KnowledgeRepository,
  owner: OwnerContext,
) {
  return repository.exportOwnedKnowledge({ owner });
}
export async function assertCollectionSourceLink(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { collectionId: string; sourceId: KnowledgeSourceId },
) {
  return repository.assertCollectionAndSourceShareOwner({ owner, ...input });
}

export async function listCollections(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { filters?: CollectionListFilters } = {},
) {
  return repository.listCollections({ filters: input.filters, owner });
}

function normalizeCollectionImageUrl(
  value: string | null | undefined,
  owner: OwnerContext,
) {
  const imageUrl = value?.trim() ?? "";

  if (!imageUrl) {
    return null;
  }

  const ownerPath = imageUrl.slice(owner.userId.length + 1);
  if (
    imageUrl.startsWith(`${owner.userId}/`) &&
    /^[0-9a-f-]+\.(jpg|png|webp)$/i.test(ownerPath)
  ) {
    return imageUrl;
  }

  assertWithinTextLimit("Collection image URL", imageUrl, 2000);

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new KnowledgeDomainError(
      "Enter a valid collection image URL",
      "collection_image_url_invalid",
    );
  }

  invariant(
    parsed.protocol === "http:" || parsed.protocol === "https:",
    "Use an HTTP or HTTPS image URL",
    "collection_image_url_protocol",
  );

  return parsed.toString();
}

function normalizeCollectionName(name: string) {
  const trimmed = name.trim();
  assertWithinTextLimit("Collection name", trimmed, knowledgeLimits.title);
  invariant(
    trimmed.length > 0,
    "Collection name is required",
    "collection_name_required",
  );
  return trimmed;
}

function normalizeCollectionDescription(value?: string | null) {
  const description = value?.trim() ?? "";
  assertWithinTextLimit("Collection description", description, 1000);
  return description || null;
}

export async function createCollection(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: {
    description?: string | null;
    imageUrl?: string | null;
    name: string;
  },
) {
  return repository.createCollection({
    description: normalizeCollectionDescription(input.description),
    imageUrl: normalizeCollectionImageUrl(input.imageUrl, owner),
    name: normalizeCollectionName(input.name),
    owner,
  });
}

export async function updateCollection(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: {
    collectionId: string;
    description?: string | null;
    imageUrl?: string | null;
    name: string;
  },
) {
  invariant(
    input.collectionId.trim().length > 0,
    "Collection is required",
    "collection_required",
  );

  return repository.updateCollection({
    collectionId: input.collectionId.trim(),
    description: normalizeCollectionDescription(input.description),
    imageUrl: normalizeCollectionImageUrl(input.imageUrl, owner),
    name: normalizeCollectionName(input.name),
    owner,
  });
}

export async function deleteCollection(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { collectionId: string },
) {
  invariant(
    input.collectionId.trim().length > 0,
    "Collection is required",
    "collection_required",
  );

  await repository.deleteCollection({
    collectionId: input.collectionId.trim(),
    owner,
  });
}

export async function deleteCollections(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { collectionIds: string[] },
) {
  const collectionIds = Array.from(
    new Set(input.collectionIds.map((id) => id.trim()).filter(Boolean)),
  );

  invariant(
    collectionIds.length > 0,
    "Select at least one collection",
    "collection_selection_required",
  );

  await repository.deleteCollections({ collectionIds, owner });
}

export async function addSourceToCollection(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { collectionId: string; sourceId: KnowledgeSourceId },
) {
  await assertCollectionSourceLink(repository, owner, input);
  await repository.addSourceToCollection({ owner, ...input });
}

export async function removeSourceFromCollection(
  repository: KnowledgeRepository,
  owner: OwnerContext,
  input: { collectionId: string; sourceId: KnowledgeSourceId },
) {
  await assertCollectionSourceLink(repository, owner, input);
  await repository.removeSourceFromCollection({ owner, ...input });
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
  CollectionListFilters,
  RetrievalResultInput,
  SourceListFilters,
  SourceType,
};
