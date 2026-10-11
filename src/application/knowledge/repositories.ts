import type {
  ChatMessageId,
  ChatRole,
  ChatThreadId,
  CitationSnapshotDto,
  IngestionJobStatus,
  JsonObject,
  KnowledgeSourceId,
  OwnerId,
  SourceChunkId,
  SourceContentId,
  SourceStatus,
  SourceSummaryDto,
  SourceType,
} from "@/domain/knowledge";

export type OwnerContext = {
  userId: OwnerId;
};

export type ProfileDto = {
  id: OwnerId;
  displayName: string | null;
  avatarStoragePath: string | null;
  avatarUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeSourceRecord = {
  id: KnowledgeSourceId;
  userId: OwnerId;
  type: SourceType;
  title: string;
  status: SourceStatus;
  fingerprint: string;
  metadata: JsonObject;
  deletedAt: Date | null;
  purgedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContentChunkInput = {
  text: string;
  tokenCount: number;
  contentHash: string;
};

export type EmbeddingInput = {
  chunkPosition: number;
  provider: string;
  model: string;
  dimensions: number;
  embedding: number[];
  contentHash: string;
};

export type RetrievalResultInput = {
  chunkId: SourceChunkId;
  rank: number;
  score: number;
};

export type RetrievalChunkDto = {
  chunk_id: SourceChunkId;
  source_id: KnowledgeSourceId;
  source_title: string;
  source_type: SourceType;
  source_fingerprint: string;
  source_content_id: SourceContentId;
  content_version: number;
  chunk_position: number;
  chunk_hash: string;
  text: string;
  score: number;
};

export type AnswerCitationInput = {
  chunkId: SourceChunkId;
  sourceIdSnapshot: KnowledgeSourceId;
  sourceTypeSnapshot: SourceType;
  sourceTitleSnapshot: string;
  sourceFingerprintSnapshot: string;
  sourceContentIdSnapshot: SourceContentId;
  contentVersionSnapshot: number;
  chunkPositionSnapshot: number;
  chunkHashSnapshot: string;
  locationSnapshot: JsonObject;
  quote: string | null;
  rank: number;
};

export type PaginatedSourceSummaries = {
  items: SourceSummaryDto[];
  next_cursor: string | null;
  total: number;
};

export type SourceListFilters = {
  query?: string;
  status?: SourceStatus;
  type?: SourceType;
  collectionId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type RetrievalFilters = {
  collectionId?: string;
};
export type CollectionSummaryDto = {
  collection_id: string;
  created_at: Date;
  description?: string | null;
  image_url: string | null;
  name: string;
  source_count: number;
  updated_at: Date;
};

export type CollectionListFilters = {
  createdFrom?: string;
  createdTo?: string;
  hasImage?: boolean;
  hasSources?: boolean;
  query?: string;
  sort?: "name" | "newest" | "source_count" | "updated";
};

export type CollectionDetailDto = {
  collection: CollectionSummaryDto;
  sources: SourceSummaryDto[];
};

export type SourceDetailDto = {
  source: SourceSummaryDto & {
    metadata: JsonObject;
    fingerprint: string;
  };
  active_content_text: string | null;
  collections: CollectionSummaryDto[];
};

export type SourceCitationDto = {
  chunk_position: number;
  citation_id: string;
  cited_at: Date;
  content_version: number;
  quote: string | null;
  rank: number;
  thread_id: string;
  thread_title: string;
};

export type KnowledgeExportDto = {
  exported_at: Date;
  sources: Array<{
    source_id: KnowledgeSourceId;
    type: SourceType;
    title: string;
    status: SourceStatus;
    fingerprint: string;
    metadata: JsonObject;
    active_content_text: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    purged_at: Date | null;
  }>;
  collections: Array<{
    collection_id: string;
    name: string;
    image_url: string | null;
    created_at: Date;
    updated_at: Date;
  }>;
  collection_sources: Array<{
    collection_id: string;
    source_id: KnowledgeSourceId;
  }>;
  chat_threads: Array<{
    thread_id: ChatThreadId;
    title: string;
    created_at: Date;
    updated_at: Date;
  }>;
  chat_messages: Array<{
    message_id: ChatMessageId;
    thread_id: ChatThreadId;
    role: ChatRole;
    content: string;
    created_at: Date;
  }>;
  retrieval_runs: Array<{
    retrieval_run_id: string;
    message_id: ChatMessageId;
    query: string;
    filters: JsonObject;
    prompt_context_hash: string;
    created_at: Date;
  }>;
  retrieval_results: Array<{
    retrieval_result_id: string;
    retrieval_run_id: string;
    chunk_id: SourceChunkId | null;
    rank: number;
    score: number;
  }>;
  answer_citations: Array<{
    citation_id: string;
    message_id: ChatMessageId;
    chunk_id: SourceChunkId | null;
    source_id_snapshot: KnowledgeSourceId;
    source_type_snapshot: SourceType;
    source_title_snapshot: string;
    source_fingerprint_snapshot: string;
    source_content_id_snapshot: SourceContentId;
    content_version_snapshot: number;
    chunk_position_snapshot: number;
    chunk_hash_snapshot: string;
    location_snapshot: JsonObject;
    quote: string | null;
    rank: number;
    created_at: Date;
  }>;
};
export interface KnowledgeRepository {
  ensureProfile(input: {
    owner: OwnerContext;
    displayName?: string | null;
  }): Promise<void>;

  getProfile(input: { owner: OwnerContext }): Promise<ProfileDto | null>;

  updateProfile(input: {
    owner: OwnerContext;
    displayName: string | null;
  }): Promise<ProfileDto>;

  updateProfileAvatar(input: {
    owner: OwnerContext;
    avatarStoragePath: string | null;
    avatarUpdatedAt: Date | null;
  }): Promise<ProfileDto>;

  deleteProfile(input: { owner: OwnerContext }): Promise<void>;

  createKnowledgeSource(input: {
    owner: OwnerContext;
    type: SourceType;
    title: string;
    status: SourceStatus;
    fingerprint: string;
    metadata: JsonObject;
  }): Promise<SourceSummaryDto>;

  findActiveSourceByFingerprint(input: {
    owner: OwnerContext;
    type: SourceType;
    fingerprint: string;
  }): Promise<KnowledgeSourceRecord | null>;

  getSourceForOwner(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
  }): Promise<KnowledgeSourceRecord | null>;

  updateKnowledgeSourceDetails(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
    fingerprint: string;
    title: string;
    metadata: JsonObject;
    status: SourceStatus;
  }): Promise<void>;

  recordExtractedContent(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
    text: string;
    contentHash: string;
  }): Promise<{ contentId: SourceContentId; version: number }>;

  replaceActiveChunks(input: {
    owner: OwnerContext;
    contentId: SourceContentId;
    chunks: ContentChunkInput[];
    embeddings: EmbeddingInput[];
  }): Promise<{
    activeChunkIds: SourceChunkId[];
    inactivePreviousContentId: SourceContentId | null;
  }>;

  createIngestionJob(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
    status: IngestionJobStatus;
  }): Promise<{ jobId: string; status: IngestionJobStatus }>;

  updateIngestionJob(input: {
    owner: OwnerContext;
    jobId: string;
    status: IngestionJobStatus;
    retryable: boolean;
    lastErrorCode?: string | null;
    lastErrorMessage?: string | null;
  }): Promise<void>;

  updateSourceStatus(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
    status: SourceStatus;
  }): Promise<void>;

  softDeleteSource(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
  }): Promise<void>;

  listKnowledgeSources(input: {
    owner: OwnerContext;
    cursor?: string;
    limit?: number;
    offset?: number;
    filters?: SourceListFilters;
  }): Promise<PaginatedSourceSummaries>;

  listArchivedSources(input: {
    owner: OwnerContext;
    limit?: number;
  }): Promise<SourceSummaryDto[]>;

  getSourceDetail(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
  }): Promise<SourceDetailDto | null>;

  listSourceCitations(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
  }): Promise<SourceCitationDto[]>;

  exportOwnedKnowledge(input: {
    owner: OwnerContext;
  }): Promise<KnowledgeExportDto>;

  purgeArchivedSource(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
  }): Promise<{ sourceId: KnowledgeSourceId; purgedAt: Date }>;

  listCollections(input: {
    filters?: CollectionListFilters;
    owner: OwnerContext;
  }): Promise<CollectionSummaryDto[]>;

  getCollectionDetail(input: {
    collectionId: string;
    owner: OwnerContext;
  }): Promise<CollectionDetailDto | null>;

  createCollection(input: {
    description?: string | null;
    imageUrl?: string | null;
    owner: OwnerContext;
    name: string;
  }): Promise<CollectionSummaryDto>;

  updateCollection(input: {
    collectionId: string;
    description?: string | null;
    imageUrl: string | null;
    name: string;
    owner: OwnerContext;
  }): Promise<CollectionSummaryDto>;

  deleteCollection(input: {
    collectionId: string;
    owner: OwnerContext;
  }): Promise<void>;

  deleteCollections(input: {
    collectionIds: string[];
    owner: OwnerContext;
  }): Promise<void>;

  addSourceToCollection(input: {
    owner: OwnerContext;
    collectionId: string;
    sourceId: KnowledgeSourceId;
  }): Promise<void>;

  removeSourceFromCollection(input: {
    owner: OwnerContext;
    collectionId: string;
    sourceId: KnowledgeSourceId;
  }): Promise<void>;

  assertCollectionAndSourceShareOwner(input: {
    owner: OwnerContext;
    collectionId: string;
    sourceId: KnowledgeSourceId;
  }): Promise<void>;

  createChatThread(input: {
    owner: OwnerContext;
    title: string;
  }): Promise<{ threadId: ChatThreadId; title: string }>;

  getDefaultChatThread(input: {
    owner: OwnerContext;
  }): Promise<{ threadId: ChatThreadId; title: string } | null>;

  recordChatMessage(input: {
    owner: OwnerContext;
    threadId: ChatThreadId;
    role: ChatRole;
    content: string;
  }): Promise<{ messageId: ChatMessageId; createdAt: Date }>;

  recordRetrievalRun(input: {
    owner: OwnerContext;
    assistantMessageId: ChatMessageId;
    query: string;
    filters: JsonObject;
    promptContextHash: string;
    results: RetrievalResultInput[];
  }): Promise<{
    retrievalRunId: string;
    selectedChunks: RetrievalResultInput[];
  }>;

  recordAnswerCitations(input: {
    owner: OwnerContext;
    assistantMessageId: ChatMessageId;
    citations: AnswerCitationInput[];
  }): Promise<CitationSnapshotDto[]>;

  retrieveOwnedChunks(input: {
    owner: OwnerContext;
    embedding: number[];
    limit: number;
    filters?: RetrievalFilters;
  }): Promise<RetrievalChunkDto[]>;

  getDashboardSummary(input: { owner: OwnerContext }): Promise<{
    collections: CollectionSummaryDto[];
    metrics: {
      totalSources: number;
      noteSources: number;
      unsortedSources: number;
    };
    sources: SourceSummaryDto[];
    ingestion: {
      queuedCount: number;
      processingCount: number;
      failedCount: number;
      latestActivity: string | null;
    };
    defaultThread: { threadId: ChatThreadId; title: string } | null;
  }>;
}
