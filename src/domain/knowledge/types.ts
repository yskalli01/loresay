export const sourceTypes = ["note", "document", "url", "connector"] as const;
export type SourceType = (typeof sourceTypes)[number];

export const sourceStatuses = [
  "draft",
  "processing",
  "ready",
  "failed",
  "deleted",
  "purged",
] as const;
export type SourceStatus = (typeof sourceStatuses)[number];

export const ingestionJobStatuses = [
  "queued",
  "running",
  "succeeded",
  "failed_retryable",
  "failed_terminal",
] as const;
export type IngestionJobStatus = (typeof ingestionJobStatuses)[number];

export const chatRoles = ["user", "assistant", "system"] as const;
export type ChatRole = (typeof chatRoles)[number];

export const knowledgeLimits = {
  chunksPerSource: 2000,
  chunkText: 8 * 1024,
  citationQuote: 1000,
  citationsPerAnswer: 20,
  chatMessageText: 32 * 1024,
  metadataJson: 16 * 1024,
  sourceText: 2 * 1024 * 1024,
  tagName: 40,
  title: 200,
  retrievalResultsPerAnswer: 50,
} as const;

export type OwnerId = string;
export type KnowledgeSourceId = string;
export type SourceContentId = string;
export type SourceChunkId = string;
export type ChatThreadId = string;
export type ChatMessageId = string;

export type JsonObject = Record<string, unknown>;

export type NoteSourceMetadata = {
  note_id: string;
  body_hash: string;
};

export type DocumentSourceMetadata = {
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  byte_size: number;
  file_hash: string;
};

export type UrlSourceMetadata = {
  original_url: string;
  canonical_url: string;
  url_hash: string;
};

export type ConnectorSourceMetadata = {
  connector_key: string;
  external_id: string;
  external_updated_at?: string | null;
  external_url?: string | null;
};

export type SourceMetadataByType = {
  note: NoteSourceMetadata;
  document: DocumentSourceMetadata;
  url: UrlSourceMetadata;
  connector: ConnectorSourceMetadata;
};

export type SourceMetadata<TType extends SourceType = SourceType> =
  SourceMetadataByType[TType];

export type SourceSummaryDto = {
  source_id: KnowledgeSourceId;
  type: SourceType;
  title: string;
  status: SourceStatus;
  created_at: Date;
  updated_at: Date;
  active_content_text?: string | null;
};

export type CitationSnapshotDto = {
  citation_id: string;
  source_id_snapshot: KnowledgeSourceId;
  source_type_snapshot: SourceType;
  source_title_snapshot: string;
  source_content_id_snapshot: SourceContentId;
  content_version_snapshot: number;
  chunk_position_snapshot: number;
  chunk_hash_snapshot: string;
  quote: string | null;
  rank: number;
};
