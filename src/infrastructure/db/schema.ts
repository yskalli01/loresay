import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

import {
  chatRoles,
  ingestionJobStatuses,
  sourceStatuses,
  sourceTypes,
  type ChatRole,
  type IngestionJobStatus,
  type JsonObject,
  type SourceStatus,
  type SourceType,
} from "@/domain/knowledge";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const sourceTypeEnum = pgEnum("source_type", sourceTypes);
export const sourceStatusEnum = pgEnum("source_status", sourceStatuses);
export const ingestionJobStatusEnum = pgEnum(
  "ingestion_job_status",
  ingestionJobStatuses,
);
export const chatRoleEnum = pgEnum("chat_role", chatRoles);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  ...timestamps,
});

export const knowledgeSources = pgTable(
  "knowledge_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: sourceTypeEnum("type").$type<SourceType>().notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    status: sourceStatusEnum("status").$type<SourceStatus>().notNull(),
    fingerprint: text("fingerprint").notNull(),
    metadata: jsonb("metadata").$type<JsonObject>().notNull().default({}),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    purgedAt: timestamp("purged_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("knowledge_sources_active_fingerprint_idx")
      .on(table.userId, table.type, table.fingerprint)
      .where(sql`${table.deletedAt} is null`),
    index("knowledge_sources_user_updated_idx").on(
      table.userId,
      table.updatedAt.desc(),
      table.id.desc(),
    ),
    index("knowledge_sources_user_status_idx").on(table.userId, table.status),
    check(
      "knowledge_sources_title_limit",
      sql`char_length(${table.title}) <= 200`,
    ),
  ],
);

export const sourceContents = pgTable(
  "source_contents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    text: text("text").notNull(),
    contentHash: text("content_hash").notNull(),
    extractedAt: timestamp("extracted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    active: boolean("active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("source_contents_source_version_idx").on(
      table.sourceId,
      table.version,
    ),
    uniqueIndex("source_contents_one_active_idx")
      .on(table.sourceId)
      .where(sql`${table.active} = true`),
    index("source_contents_source_idx").on(table.sourceId),
    check("source_contents_version_positive", sql`${table.version} > 0`),
  ],
);

export const sourceChunks = pgTable(
  "source_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceContentId: uuid("source_content_id")
      .notNull()
      .references(() => sourceContents.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    tokenCount: integer("token_count").notNull(),
    contentHash: text("content_hash").notNull(),
    active: boolean("active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("source_chunks_content_position_idx").on(
      table.sourceContentId,
      table.position,
    ),
    index("source_chunks_source_active_idx").on(table.sourceId, table.active),
    check("source_chunks_position_positive", sql`${table.position} > 0`),
    check("source_chunks_token_count_valid", sql`${table.tokenCount} >= 0`),
  ],
);

export const chunkEmbeddings = pgTable(
  "chunk_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chunkId: uuid("chunk_id")
      .notNull()
      .references(() => sourceChunks.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    dimensions: integer("dimensions").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    contentHash: text("content_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("chunk_embeddings_model_hash_idx").on(
      table.chunkId,
      table.provider,
      table.model,
      table.contentHash,
    ),
    index("chunk_embeddings_vector_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    check("chunk_embeddings_dimensions_match", sql`${table.dimensions} = 1536`),
  ],
);

export const ingestionJobs = pgTable(
  "ingestion_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: "cascade" }),
    status: ingestionJobStatusEnum("status")
      .$type<IngestionJobStatus>()
      .notNull(),
    attempts: integer("attempts").notNull().default(0),
    retryable: boolean("retryable").notNull().default(true),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("ingestion_jobs_source_created_idx").on(
      table.sourceId,
      table.createdAt,
    ),
    check("ingestion_jobs_attempts_valid", sql`${table.attempts} >= 0`),
    check(
      "ingestion_jobs_terminal_not_retryable",
      sql`${table.status} != 'failed_terminal' or ${table.retryable} = false`,
    ),
  ],
);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("collections_user_name_idx").on(table.userId, table.name),
    check("collections_name_limit", sql`char_length(${table.name}) <= 200`),
  ],
);

export const collectionSources = pgTable(
  "collection_sources",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.collectionId, table.sourceId],
      name: "collection_sources_pk",
    }),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 40 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tags_user_name_idx").on(table.userId, table.name),
    check("tags_name_limit", sql`char_length(${table.name}) <= 40`),
  ],
);

export const sourceTags = pgTable(
  "source_tags",
  {
    sourceId: uuid("source_id")
      .notNull()
      .references(() => knowledgeSources.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.sourceId, table.tagId],
      name: "source_tags_pk",
    }),
  ],
);

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("chat_threads_user_updated_idx").on(
      table.userId,
      table.updatedAt.desc(),
      table.id.desc(),
    ),
    check("chat_threads_title_limit", sql`char_length(${table.title}) <= 200`),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").$type<ChatRole>().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("chat_messages_thread_created_idx").on(
      table.threadId,
      table.createdAt,
    ),
    check(
      "chat_messages_content_limit",
      sql`char_length(${table.content}) <= 32768`,
    ),
  ],
);

export const retrievalRuns = pgTable(
  "retrieval_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => chatMessages.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    filters: jsonb("filters").$type<JsonObject>().notNull().default({}),
    promptContextHash: text("prompt_context_hash").notNull(),
    durationMs: integer("duration_ms"),
    tokenCount: integer("token_count"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("retrieval_runs_message_idx").on(table.messageId),
    check(
      "retrieval_runs_duration_valid",
      sql`${table.durationMs} is null or ${table.durationMs} >= 0`,
    ),
    check(
      "retrieval_runs_token_count_valid",
      sql`${table.tokenCount} is null or ${table.tokenCount} >= 0`,
    ),
  ],
);

export const retrievalResults = pgTable(
  "retrieval_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    retrievalRunId: uuid("retrieval_run_id")
      .notNull()
      .references(() => retrievalRuns.id, { onDelete: "cascade" }),
    chunkId: uuid("chunk_id")
      .notNull()
      .references(() => sourceChunks.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    score: doublePrecision("score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("retrieval_results_run_rank_idx").on(
      table.retrievalRunId,
      table.rank,
    ),
    check("retrieval_results_rank_range", sql`${table.rank} between 1 and 50`),
  ],
);

export const answerCitations = pgTable(
  "answer_citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => chatMessages.id, { onDelete: "cascade" }),
    chunkId: uuid("chunk_id").references(() => sourceChunks.id, {
      onDelete: "set null",
    }),
    sourceIdSnapshot: uuid("source_id_snapshot").notNull(),
    sourceTypeSnapshot: sourceTypeEnum("source_type_snapshot")
      .$type<SourceType>()
      .notNull(),
    sourceTitleSnapshot: varchar("source_title_snapshot", {
      length: 200,
    }).notNull(),
    sourceFingerprintSnapshot: text("source_fingerprint_snapshot").notNull(),
    sourceContentIdSnapshot: uuid("source_content_id_snapshot").notNull(),
    contentVersionSnapshot: integer("content_version_snapshot").notNull(),
    chunkPositionSnapshot: integer("chunk_position_snapshot").notNull(),
    chunkHashSnapshot: text("chunk_hash_snapshot").notNull(),
    locationSnapshot: jsonb("location_snapshot")
      .$type<JsonObject>()
      .notNull()
      .default({}),
    quote: varchar("quote", { length: 1000 }),
    rank: integer("rank").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("answer_citations_message_rank_idx").on(
      table.messageId,
      table.rank,
    ),
    check("answer_citations_rank_range", sql`${table.rank} between 1 and 20`),
  ],
);
