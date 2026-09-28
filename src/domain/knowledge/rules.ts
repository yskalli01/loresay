import {
  chatRoles,
  ingestionJobStatuses,
  knowledgeLimits,
  sourceStatuses,
  sourceTypes,
  type ChatRole,
  type ConnectorSourceMetadata,
  type DocumentSourceMetadata,
  type IngestionJobStatus,
  type JsonObject,
  type NoteSourceMetadata,
  type SourceMetadata,
  type SourceStatus,
  type SourceType,
  type UrlSourceMetadata,
} from "./types";
import { invariant } from "./errors";

export function assertKnownSourceType(
  value: string,
): asserts value is SourceType {
  invariant(
    sourceTypes.includes(value as SourceType),
    `Unsupported source type: ${value}`,
    "invalid_source_type",
  );
}

export function assertKnownSourceStatus(
  value: string,
): asserts value is SourceStatus {
  invariant(
    sourceStatuses.includes(value as SourceStatus),
    `Unsupported source status: ${value}`,
    "invalid_source_status",
  );
}

export function assertKnownIngestionJobStatus(
  value: string,
): asserts value is IngestionJobStatus {
  invariant(
    ingestionJobStatuses.includes(value as IngestionJobStatus),
    `Unsupported ingestion job status: ${value}`,
    "invalid_ingestion_job_status",
  );
}

export function assertKnownChatRole(value: string): asserts value is ChatRole {
  invariant(
    chatRoles.includes(value as ChatRole),
    `Unsupported chat role: ${value}`,
    "invalid_chat_role",
  );
}

export function assertWithinTextLimit(
  label: string,
  value: string,
  limit: number,
) {
  invariant(
    value.length <= limit,
    `${label} must be ${limit} characters or fewer`,
    "text_limit_exceeded",
  );
}

export function assertMetadataLimit(metadata: JsonObject) {
  const size = JSON.stringify(metadata).length;

  invariant(
    size <= knowledgeLimits.metadataJson,
    "Source metadata is too large",
    "metadata_limit_exceeded",
  );
}

export function assertCitationRanks(ranks: number[]) {
  invariant(
    ranks.length <= knowledgeLimits.citationsPerAnswer,
    "An answer can have at most 20 citations",
    "citation_limit_exceeded",
  );

  const uniqueRanks = new Set(ranks);
  invariant(
    uniqueRanks.size === ranks.length,
    "Citation ranks must be unique per answer",
    "duplicate_citation_rank",
  );

  ranks.forEach((rank) => {
    invariant(
      Number.isInteger(rank) &&
        rank >= 1 &&
        rank <= knowledgeLimits.citationsPerAnswer,
      "Citation ranks must be between 1 and 20",
      "invalid_citation_rank",
    );
  });
}

export function assertRetrievalRanks(ranks: number[]) {
  invariant(
    ranks.length <= knowledgeLimits.retrievalResultsPerAnswer,
    "A retrieval run can have at most 50 selected results",
    "retrieval_result_limit_exceeded",
  );

  ranks.forEach((rank) => {
    invariant(
      Number.isInteger(rank) &&
        rank >= 1 &&
        rank <= knowledgeLimits.retrievalResultsPerAnswer,
      "Retrieval result ranks must be between 1 and 50",
      "invalid_retrieval_rank",
    );
  });
}

export function canTransitionSourceStatus(
  from: SourceStatus,
  to: SourceStatus,
) {
  const transitions: Record<SourceStatus, SourceStatus[]> = {
    draft: ["processing", "deleted"],
    processing: ["ready", "failed", "deleted"],
    ready: ["processing", "deleted"],
    failed: ["processing", "deleted"],
    deleted: ["purged"],
    purged: [],
  };

  return transitions[from].includes(to);
}

export function canTransitionIngestionJobStatus(
  from: IngestionJobStatus,
  to: IngestionJobStatus,
) {
  const transitions: Record<IngestionJobStatus, IngestionJobStatus[]> = {
    queued: ["running"],
    running: ["succeeded", "failed_retryable", "failed_terminal"],
    succeeded: [],
    failed_retryable: ["queued"],
    failed_terminal: [],
  };

  return transitions[from].includes(to);
}

export function assertSourceStatusTransition(
  from: SourceStatus,
  to: SourceStatus,
) {
  invariant(
    canTransitionSourceStatus(from, to),
    `Cannot transition source from ${from} to ${to}`,
    "invalid_source_status_transition",
  );
}

export function assertIngestionJobStatusTransition(
  from: IngestionJobStatus,
  to: IngestionJobStatus,
) {
  invariant(
    canTransitionIngestionJobStatus(from, to),
    `Cannot transition ingestion job from ${from} to ${to}`,
    "invalid_ingestion_job_status_transition",
  );
}

export function normalizeUrlForFingerprint(url: string) {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase();

  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

export function deriveSourceFingerprint<TType extends SourceType>(
  type: TType,
  metadata: SourceMetadata<TType>,
) {
  switch (type) {
    case "note":
      return (metadata as NoteSourceMetadata).note_id;
    case "document":
      return (metadata as DocumentSourceMetadata).file_hash;
    case "url":
      return (metadata as UrlSourceMetadata).url_hash;
    case "connector": {
      const connector = metadata as ConnectorSourceMetadata;
      return `${connector.connector_key}:${connector.external_id}`;
    }
  }
}

export function deriveSourceTitle<TType extends SourceType>(
  type: TType,
  metadata: SourceMetadata<TType>,
  title?: string | null,
  noteBody?: string,
) {
  if (title?.trim()) {
    return title.trim().slice(0, knowledgeLimits.title);
  }

  switch (type) {
    case "note":
      return (noteBody?.trim() || "Untitled note").slice(0, 80);
    case "document":
      return (metadata as DocumentSourceMetadata).file_name.slice(
        0,
        knowledgeLimits.title,
      );
    case "url": {
      const urlMetadata = metadata as UrlSourceMetadata;
      return new URL(urlMetadata.canonical_url).hostname.slice(
        0,
        knowledgeLimits.title,
      );
    }
    case "connector":
      return "Imported source";
  }
}

export function initialSourceStatus(type: SourceType): SourceStatus {
  return type === "note" ? "draft" : "processing";
}

export function assertSourceMetadata<TType extends SourceType>(
  type: TType,
  metadata: JsonObject,
): asserts metadata is SourceMetadata<TType> {
  assertMetadataLimit(metadata);

  const requireString = (key: string) => {
    invariant(
      typeof metadata[key] === "string" &&
        (metadata[key] as string).trim().length > 0,
      `Source metadata must include ${key}`,
      "invalid_source_metadata",
    );
  };

  switch (type) {
    case "note":
      requireString("note_id");
      requireString("body_hash");
      return;
    case "document":
      requireString("storage_bucket");
      requireString("storage_path");
      requireString("file_name");
      requireString("mime_type");
      requireString("file_hash");
      invariant(
        typeof metadata.byte_size === "number" && metadata.byte_size >= 0,
        "Document metadata must include byte_size",
        "invalid_source_metadata",
      );
      return;
    case "url":
      requireString("original_url");
      requireString("canonical_url");
      requireString("url_hash");
      return;
    case "connector":
      requireString("connector_key");
      requireString("external_id");
      return;
  }
}
