import { readFileSync } from "node:fs";
import path from "node:path";

import { getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  answerCitations,
  chatMessages,
  chatThreads,
  chunkEmbeddings,
  collectionSources,
  collections,
  ingestionJobs,
  knowledgeSources,
  profiles,
  retrievalResults,
  retrievalRuns,
  sourceChunks,
  sourceContents,
} from "./schema";

describe("core data model schema", () => {
  it("defines the source lineage tables needed for ingestion and retrieval", () => {
    expect(Object.keys(getTableColumns(profiles))).toEqual(
      expect.arrayContaining([
        "id",
        "displayName",
        "avatarStoragePath",
        "avatarUpdatedAt",
        "createdAt",
        "updatedAt",
      ]),
    );
    expect(Object.keys(getTableColumns(knowledgeSources))).toEqual(
      expect.arrayContaining([
        "id",
        "userId",
        "type",
        "title",
        "status",
        "fingerprint",
        "metadata",
        "deletedAt",
        "purgedAt",
      ]),
    );
    expect(Object.keys(getTableColumns(sourceContents))).toEqual(
      expect.arrayContaining(["sourceId", "version", "text", "active"]),
    );
    expect(Object.keys(getTableColumns(sourceChunks))).toEqual(
      expect.arrayContaining([
        "sourceContentId",
        "sourceId",
        "position",
        "tokenCount",
        "active",
      ]),
    );
    expect(Object.keys(getTableColumns(chunkEmbeddings))).toEqual(
      expect.arrayContaining([
        "chunkId",
        "provider",
        "model",
        "dimensions",
        "embedding",
        "contentHash",
      ]),
    );
    expect(Object.keys(getTableColumns(ingestionJobs))).toEqual(
      expect.arrayContaining([
        "sourceId",
        "status",
        "attempts",
        "retryable",
        "lastErrorCode",
        "lastErrorMessage",
      ]),
    );
  });

  it("defines organization and chat provenance tables", () => {
    expect(Object.keys(getTableColumns(collections))).toEqual(
      expect.arrayContaining(["userId", "name", "description", "imageUrl"]),
    );
    expect(Object.keys(getTableColumns(collectionSources))).toEqual(
      expect.arrayContaining(["collectionId", "sourceId"]),
    );
    const sourceIndex = getTableConfig(collectionSources).indexes.find(
      (tableIndex) =>
        tableIndex.config.name === "collection_sources_source_idx",
    );

    expect(sourceIndex?.config.columns[0]).toMatchObject({
      name: "source_id",
    });
    expect(Object.keys(getTableColumns(chatThreads))).toEqual(
      expect.arrayContaining(["userId", "title"]),
    );
    expect(Object.keys(getTableColumns(chatMessages))).toEqual(
      expect.arrayContaining(["threadId", "role", "content"]),
    );
    expect(Object.keys(getTableColumns(retrievalRuns))).toEqual(
      expect.arrayContaining([
        "messageId",
        "query",
        "filters",
        "promptContextHash",
        "durationMs",
        "tokenCount",
      ]),
    );
    expect(Object.keys(getTableColumns(retrievalResults))).toEqual(
      expect.arrayContaining(["retrievalRunId", "chunkId", "rank", "score"]),
    );
  });

  it("keeps answer citations useful after source purge", () => {
    expect(Object.keys(getTableColumns(answerCitations))).toEqual(
      expect.arrayContaining([
        "messageId",
        "chunkId",
        "sourceIdSnapshot",
        "sourceTypeSnapshot",
        "sourceTitleSnapshot",
        "sourceFingerprintSnapshot",
        "sourceContentIdSnapshot",
        "contentVersionSnapshot",
        "chunkPositionSnapshot",
        "chunkHashSnapshot",
        "locationSnapshot",
        "quote",
        "rank",
      ]),
    );
  });

  it("documents owner scoped RLS policies for direct and child tables", () => {
    const sql = readFileSync(
      path.join(process.cwd(), "src/infrastructure/db/rls-policies.sql"),
      "utf8",
    );

    [
      "alter table knowledge_sources enable row level security",
      "alter table source_chunks enable row level security",
      "alter table answer_citations enable row level security",
      "knowledge_sources.user_id = auth.uid()",
      "chat_threads.user_id = auth.uid()",
      "on answer_citations",
    ].forEach((expected) => {
      expect(sql).toContain(expected);
    });
  });
});
