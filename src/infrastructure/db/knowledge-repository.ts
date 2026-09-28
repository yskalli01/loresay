import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";

import type {
  AnswerCitationInput,
  ContentChunkInput,
  EmbeddingInput,
  KnowledgeRepository,
  OwnerContext,
  RetrievalChunkDto,
  RetrievalResultInput,
} from "@/application/knowledge/repositories";
import type {
  ChatRole,
  IngestionJobStatus,
  JsonObject,
  KnowledgeSourceId,
  SourceStatus,
  SourceType,
} from "@/domain/knowledge";

import { db } from "./client";
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
  sourceTags,
  tags,
} from "./schema";

function vectorLiteral(embedding: number[]) {
  return `[${embedding.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

function sourceSummary(
  row: typeof knowledgeSources.$inferSelect,
  activeContentText: string | null = null,
) {
  return {
    created_at: row.createdAt,
    source_id: row.id,
    status: row.status,
    title: row.title,
    type: row.type,
    updated_at: row.updatedAt,
    active_content_text: activeContentText,
  };
}

export class DrizzleKnowledgeRepository implements KnowledgeRepository {
  async ensureProfile(input: {
    owner: OwnerContext;
    displayName?: string | null;
  }) {
    await db
      .insert(profiles)
      .values({
        displayName: input.displayName ?? null,
        id: input.owner.userId,
      })
      .onConflictDoNothing();
  }

  async createKnowledgeSource(input: {
    owner: OwnerContext;
    type: SourceType;
    title: string;
    status: SourceStatus;
    fingerprint: string;
    metadata: JsonObject;
  }) {
    const [row] = await db
      .insert(knowledgeSources)
      .values({
        fingerprint: input.fingerprint,
        metadata: input.metadata,
        status: input.status,
        title: input.title,
        type: input.type,
        userId: input.owner.userId,
      })
      .returning();

    return sourceSummary(row);
  }

  async findActiveSourceByFingerprint(input: {
    owner: OwnerContext;
    type: SourceType;
    fingerprint: string;
  }) {
    const [row] = await db
      .select()
      .from(knowledgeSources)
      .where(
        and(
          eq(knowledgeSources.userId, input.owner.userId),
          eq(knowledgeSources.type, input.type),
          eq(knowledgeSources.fingerprint, input.fingerprint),
          isNull(knowledgeSources.deletedAt),
        ),
      )
      .limit(1);

    return row
      ? {
          createdAt: row.createdAt,
          deletedAt: row.deletedAt,
          fingerprint: row.fingerprint,
          id: row.id,
          metadata: row.metadata,
          status: row.status,
          title: row.title,
          type: row.type,
          updatedAt: row.updatedAt,
          userId: row.userId,
        }
      : null;
  }

  async getSourceForOwner(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
  }) {
    const [row] = await db
      .select()
      .from(knowledgeSources)
      .where(
        and(
          eq(knowledgeSources.id, input.sourceId),
          eq(knowledgeSources.userId, input.owner.userId),
        ),
      )
      .limit(1);

    return row
      ? {
          createdAt: row.createdAt,
          deletedAt: row.deletedAt,
          fingerprint: row.fingerprint,
          id: row.id,
          metadata: row.metadata,
          status: row.status,
          title: row.title,
          type: row.type,
          updatedAt: row.updatedAt,
          userId: row.userId,
        }
      : null;
  }

  async updateKnowledgeSourceDetails(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
    title: string;
    metadata: JsonObject;
    status: SourceStatus;
  }) {
    await db
      .update(knowledgeSources)
      .set({
        metadata: input.metadata,
        status: input.status,
        title: input.title,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(knowledgeSources.id, input.sourceId),
          eq(knowledgeSources.userId, input.owner.userId),
          isNull(knowledgeSources.deletedAt),
        ),
      );
  }

  async recordExtractedContent(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
    text: string;
    contentHash: string;
  }) {
    return db.transaction(async (tx) => {
      const [{ nextVersion }] = await tx
        .select({
          nextVersion: sql<number>`coalesce(max(${sourceContents.version}), 0) + 1`,
        })
        .from(sourceContents)
        .where(eq(sourceContents.sourceId, input.sourceId));

      await tx
        .update(sourceContents)
        .set({ active: false })
        .where(eq(sourceContents.sourceId, input.sourceId));

      const [row] = await tx
        .insert(sourceContents)
        .values({
          active: true,
          contentHash: input.contentHash,
          sourceId: input.sourceId,
          text: input.text,
          version: nextVersion,
        })
        .returning({
          contentId: sourceContents.id,
          version: sourceContents.version,
        });

      return row;
    });
  }

  async replaceActiveChunks(input: {
    owner: OwnerContext;
    contentId: string;
    chunks: ContentChunkInput[];
    embeddings: EmbeddingInput[];
  }) {
    return db.transaction(async (tx) => {
      const [content] = await tx
        .select()
        .from(sourceContents)
        .innerJoin(
          knowledgeSources,
          eq(sourceContents.sourceId, knowledgeSources.id),
        )
        .where(
          and(
            eq(sourceContents.id, input.contentId),
            eq(knowledgeSources.userId, input.owner.userId),
          ),
        )
        .limit(1);

      if (!content) {
        throw new Error("Content not found");
      }

      await tx
        .update(sourceChunks)
        .set({ active: false })
        .where(eq(sourceChunks.sourceId, content.source_contents.sourceId));

      const insertedChunks = await tx
        .insert(sourceChunks)
        .values(
          input.chunks.map((chunk, index) => ({
            active: true,
            contentHash: chunk.contentHash,
            position: index + 1,
            sourceContentId: input.contentId,
            sourceId: content.source_contents.sourceId,
            text: chunk.text,
            tokenCount: chunk.tokenCount,
          })),
        )
        .returning({ id: sourceChunks.id, position: sourceChunks.position });

      await tx.insert(chunkEmbeddings).values(
        input.embeddings.map((embedding) => {
          const chunk = insertedChunks.find(
            (item) => item.position === embedding.chunkPosition,
          );

          if (!chunk) {
            throw new Error("Embedding chunk position not found");
          }

          return {
            chunkId: chunk.id,
            contentHash: embedding.contentHash,
            dimensions: embedding.dimensions,
            embedding: embedding.embedding,
            model: embedding.model,
            provider: embedding.provider,
          };
        }),
      );

      return {
        activeChunkIds: insertedChunks.map((chunk) => chunk.id),
        inactivePreviousContentId: null,
      };
    });
  }

  async createIngestionJob(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
    status: IngestionJobStatus;
  }) {
    const [row] = await db
      .insert(ingestionJobs)
      .values({
        sourceId: input.sourceId,
        startedAt: new Date(),
        status: input.status,
      })
      .returning({ jobId: ingestionJobs.id, status: ingestionJobs.status });

    return row;
  }

  async updateIngestionJob(input: {
    owner: OwnerContext;
    jobId: string;
    status: IngestionJobStatus;
    retryable: boolean;
    lastErrorCode?: string | null;
    lastErrorMessage?: string | null;
  }) {
    await db
      .update(ingestionJobs)
      .set({
        finishedAt: new Date(),
        lastErrorCode: input.lastErrorCode ?? null,
        lastErrorMessage: input.lastErrorMessage ?? null,
        retryable: input.retryable,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(ingestionJobs.id, input.jobId));
  }

  async updateSourceStatus(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
    status: SourceStatus;
  }) {
    await db
      .update(knowledgeSources)
      .set({ status: input.status, updatedAt: new Date() })
      .where(
        and(
          eq(knowledgeSources.id, input.sourceId),
          eq(knowledgeSources.userId, input.owner.userId),
        ),
      );
  }

  async softDeleteSource(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
  }) {
    await db
      .update(knowledgeSources)
      .set({
        deletedAt: new Date(),
        status: "deleted",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(knowledgeSources.id, input.sourceId),
          eq(knowledgeSources.userId, input.owner.userId),
          isNull(knowledgeSources.deletedAt),
        ),
      );

    await db
      .update(sourceChunks)
      .set({ active: false })
      .where(eq(sourceChunks.sourceId, input.sourceId));
  }
  async listKnowledgeSources(input: {
    owner: OwnerContext;
    cursor?: string;
    limit?: number;
    filters?: {
      query?: string;
      status?: SourceStatus;
      type?: SourceType;
      collectionId?: string;
      tagId?: string;
    };
  }) {
    const conditions = [
      eq(knowledgeSources.userId, input.owner.userId),
      isNull(knowledgeSources.deletedAt),
    ];
    const filters = input.filters ?? {};

    if (filters.type) {
      conditions.push(eq(knowledgeSources.type, filters.type));
    }
    if (filters.status) {
      conditions.push(eq(knowledgeSources.status, filters.status));
    }
    if (filters.query?.trim()) {
      conditions.push(
        ilike(knowledgeSources.title, `%${filters.query.trim()}%`),
      );
    }
    if (filters.collectionId) {
      conditions.push(sql`exists (
        select 1 from ${collectionSources}
        where ${collectionSources.sourceId} = ${knowledgeSources.id}
          and ${collectionSources.collectionId} = ${filters.collectionId}
      )`);
    }
    if (filters.tagId) {
      conditions.push(sql`exists (
        select 1 from ${sourceTags}
        where ${sourceTags.sourceId} = ${knowledgeSources.id}
          and ${sourceTags.tagId} = ${filters.tagId}
      )`);
    }

    const rows = await db
      .select({
        contentText: sourceContents.text,
        source: knowledgeSources,
      })
      .from(knowledgeSources)
      .leftJoin(
        sourceContents,
        and(
          eq(sourceContents.sourceId, knowledgeSources.id),
          eq(sourceContents.active, true),
        ),
      )
      .where(and(...conditions))
      .orderBy(desc(knowledgeSources.updatedAt), desc(knowledgeSources.id))
      .limit(input.limit ?? 50);

    return {
      items: rows.map((row) => sourceSummary(row.source, row.contentText)),
      next_cursor: null,
    };
  }

  async getSourceDetail(input: {
    owner: OwnerContext;
    sourceId: KnowledgeSourceId;
  }) {
    const rows = await db
      .select({ contentText: sourceContents.text, source: knowledgeSources })
      .from(knowledgeSources)
      .leftJoin(
        sourceContents,
        and(
          eq(sourceContents.sourceId, knowledgeSources.id),
          eq(sourceContents.active, true),
        ),
      )
      .where(
        and(
          eq(knowledgeSources.id, input.sourceId),
          eq(knowledgeSources.userId, input.owner.userId),
          isNull(knowledgeSources.deletedAt),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    const [sourceCollections, sourceTagRows] = await Promise.all([
      db
        .select({
          collection_id: collections.id,
          name: collections.name,
          source_count: sql<number>`0`,
        })
        .from(collectionSources)
        .innerJoin(
          collections,
          eq(collections.id, collectionSources.collectionId),
        )
        .where(eq(collectionSources.sourceId, input.sourceId))
        .orderBy(collections.name),
      db
        .select({
          name: tags.name,
          source_count: sql<number>`0`,
          tag_id: tags.id,
        })
        .from(sourceTags)
        .innerJoin(tags, eq(tags.id, sourceTags.tagId))
        .where(eq(sourceTags.sourceId, input.sourceId))
        .orderBy(tags.name),
    ]);

    return {
      active_content_text: row.contentText,
      collections: sourceCollections,
      source: {
        ...sourceSummary(row.source, row.contentText),
        fingerprint: row.source.fingerprint,
        metadata: row.source.metadata,
      },
      tags: sourceTagRows,
    };
  }

  async listCollections(input: { owner: OwnerContext }) {
    return db
      .select({
        collection_id: collections.id,
        name: collections.name,
        source_count: sql<number>`count(${collectionSources.sourceId})::int`,
      })
      .from(collections)
      .leftJoin(
        collectionSources,
        eq(collectionSources.collectionId, collections.id),
      )
      .where(eq(collections.userId, input.owner.userId))
      .groupBy(collections.id)
      .orderBy(collections.name);
  }

  async createCollection(input: { owner: OwnerContext; name: string }) {
    const inserted = await db
      .insert(collections)
      .values({ name: input.name, userId: input.owner.userId })
      .onConflictDoNothing()
      .returning({ collection_id: collections.id, name: collections.name });

    const row =
      inserted[0] ??
      (
        await db
          .select({ collection_id: collections.id, name: collections.name })
          .from(collections)
          .where(
            and(
              eq(collections.userId, input.owner.userId),
              eq(collections.name, input.name),
            ),
          )
          .limit(1)
      )[0];

    return { ...row, source_count: 0 };
  }

  async addSourceToCollection(input: {
    owner: OwnerContext;
    collectionId: string;
    sourceId: KnowledgeSourceId;
  }) {
    await this.assertCollectionAndSourceShareOwner(input);
    await db
      .insert(collectionSources)
      .values({ collectionId: input.collectionId, sourceId: input.sourceId })
      .onConflictDoNothing();
  }

  async listTags(input: { owner: OwnerContext }) {
    return db
      .select({
        name: tags.name,
        source_count: sql<number>`count(${sourceTags.sourceId})::int`,
        tag_id: tags.id,
      })
      .from(tags)
      .leftJoin(sourceTags, eq(sourceTags.tagId, tags.id))
      .where(eq(tags.userId, input.owner.userId))
      .groupBy(tags.id)
      .orderBy(tags.name);
  }

  async createTag(input: { owner: OwnerContext; name: string }) {
    const inserted = await db
      .insert(tags)
      .values({ name: input.name, userId: input.owner.userId })
      .onConflictDoNothing()
      .returning({ name: tags.name, tag_id: tags.id });

    const row =
      inserted[0] ??
      (
        await db
          .select({ name: tags.name, tag_id: tags.id })
          .from(tags)
          .where(
            and(eq(tags.userId, input.owner.userId), eq(tags.name, input.name)),
          )
          .limit(1)
      )[0];

    return { ...row, source_count: 0 };
  }

  async addTagToSource(input: {
    owner: OwnerContext;
    tagId: string;
    sourceId: KnowledgeSourceId;
  }) {
    await this.assertTagAndSourceShareOwner(input);
    await db
      .insert(sourceTags)
      .values({ sourceId: input.sourceId, tagId: input.tagId })
      .onConflictDoNothing();
  }

  async assertCollectionAndSourceShareOwner(input: {
    owner: OwnerContext;
    collectionId: string;
    sourceId: KnowledgeSourceId;
  }) {
    const [row] = await db
      .select({ id: collections.id })
      .from(collections)
      .innerJoin(
        knowledgeSources,
        eq(knowledgeSources.userId, collections.userId),
      )
      .where(
        and(
          eq(collections.id, input.collectionId),
          eq(knowledgeSources.id, input.sourceId),
          eq(collections.userId, input.owner.userId),
          isNull(knowledgeSources.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      throw new Error("Collection or source not found");
    }
  }

  async assertTagAndSourceShareOwner(input: {
    owner: OwnerContext;
    tagId: string;
    sourceId: KnowledgeSourceId;
  }) {
    const [row] = await db
      .select({ id: tags.id })
      .from(tags)
      .innerJoin(knowledgeSources, eq(knowledgeSources.userId, tags.userId))
      .where(
        and(
          eq(tags.id, input.tagId),
          eq(knowledgeSources.id, input.sourceId),
          eq(tags.userId, input.owner.userId),
          isNull(knowledgeSources.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      throw new Error("Tag or source not found");
    }
  }

  async createChatThread(input: { owner: OwnerContext; title: string }) {
    const [row] = await db
      .insert(chatThreads)
      .values({ title: input.title, userId: input.owner.userId })
      .returning({ threadId: chatThreads.id, title: chatThreads.title });

    return row;
  }

  async getDefaultChatThread(input: { owner: OwnerContext }) {
    const [row] = await db
      .select({ threadId: chatThreads.id, title: chatThreads.title })
      .from(chatThreads)
      .where(eq(chatThreads.userId, input.owner.userId))
      .orderBy(desc(chatThreads.updatedAt), desc(chatThreads.id))
      .limit(1);

    return row ?? null;
  }

  async recordChatMessage(input: {
    owner: OwnerContext;
    threadId: string;
    role: ChatRole;
    content: string;
  }) {
    const [thread] = await db
      .select({ id: chatThreads.id })
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.id, input.threadId),
          eq(chatThreads.userId, input.owner.userId),
        ),
      )
      .limit(1);

    if (!thread) {
      throw new Error("Thread not found");
    }

    const [row] = await db
      .insert(chatMessages)
      .values({
        content: input.content,
        role: input.role,
        threadId: input.threadId,
      })
      .returning({
        createdAt: chatMessages.createdAt,
        messageId: chatMessages.id,
      });

    await db
      .update(chatThreads)
      .set({ updatedAt: new Date() })
      .where(eq(chatThreads.id, input.threadId));

    return row;
  }

  async recordRetrievalRun(input: {
    owner: OwnerContext;
    assistantMessageId: string;
    query: string;
    filters: JsonObject;
    promptContextHash: string;
    results: RetrievalResultInput[];
  }) {
    return db.transaction(async (tx) => {
      const [run] = await tx
        .insert(retrievalRuns)
        .values({
          filters: input.filters,
          messageId: input.assistantMessageId,
          promptContextHash: input.promptContextHash,
          query: input.query,
        })
        .returning({ retrievalRunId: retrievalRuns.id });

      if (input.results.length > 0) {
        await tx.insert(retrievalResults).values(
          input.results.map((result) => ({
            chunkId: result.chunkId,
            rank: result.rank,
            retrievalRunId: run.retrievalRunId,
            score: result.score,
          })),
        );
      }

      return {
        retrievalRunId: run.retrievalRunId,
        selectedChunks: input.results,
      };
    });
  }

  async recordAnswerCitations(input: {
    owner: OwnerContext;
    assistantMessageId: string;
    citations: AnswerCitationInput[];
  }) {
    if (input.citations.length === 0) {
      return [];
    }

    const rows = await db
      .insert(answerCitations)
      .values(
        input.citations.map((citation) => ({
          chunkHashSnapshot: citation.chunkHashSnapshot,
          chunkId: citation.chunkId,
          chunkPositionSnapshot: citation.chunkPositionSnapshot,
          contentVersionSnapshot: citation.contentVersionSnapshot,
          locationSnapshot: citation.locationSnapshot,
          messageId: input.assistantMessageId,
          quote: citation.quote,
          rank: citation.rank,
          sourceContentIdSnapshot: citation.sourceContentIdSnapshot,
          sourceFingerprintSnapshot: citation.sourceFingerprintSnapshot,
          sourceIdSnapshot: citation.sourceIdSnapshot,
          sourceTitleSnapshot: citation.sourceTitleSnapshot,
          sourceTypeSnapshot: citation.sourceTypeSnapshot,
        })),
      )
      .returning();

    return rows.map((row) => ({
      chunk_hash_snapshot: row.chunkHashSnapshot,
      chunk_position_snapshot: row.chunkPositionSnapshot,
      citation_id: row.id,
      content_version_snapshot: row.contentVersionSnapshot,
      quote: row.quote,
      rank: row.rank,
      source_content_id_snapshot: row.sourceContentIdSnapshot,
      source_id_snapshot: row.sourceIdSnapshot,
      source_title_snapshot: row.sourceTitleSnapshot,
      source_type_snapshot: row.sourceTypeSnapshot,
    }));
  }

  async retrieveOwnedChunks(input: {
    owner: OwnerContext;
    embedding: number[];
    limit: number;
    filters?: { collectionId?: string; tagId?: string };
  }): Promise<RetrievalChunkDto[]> {
    const vector = vectorLiteral(input.embedding);
    const rows = await db.execute<RetrievalChunkDto>(sql`
      select
        source_chunks.id as chunk_id,
        knowledge_sources.id as source_id,
        knowledge_sources.title as source_title,
        knowledge_sources.type as source_type,
        knowledge_sources.fingerprint as source_fingerprint,
        source_contents.id as source_content_id,
        source_contents.version as content_version,
        source_chunks.position as chunk_position,
        source_chunks.content_hash as chunk_hash,
        source_chunks.text as text,
        1 - (chunk_embeddings.embedding <=> ${sql.raw(`'${vector}'::vector`)}) as score
      from chunk_embeddings
      inner join source_chunks on source_chunks.id = chunk_embeddings.chunk_id
      inner join source_contents on source_contents.id = source_chunks.source_content_id
      inner join knowledge_sources on knowledge_sources.id = source_chunks.source_id
      where knowledge_sources.user_id = ${input.owner.userId}
        and knowledge_sources.status = 'ready'
        and knowledge_sources.deleted_at is null
        and source_chunks.active = true
        and source_contents.active = true
        and (
          ${input.filters?.collectionId ?? null}::uuid is null
          or exists (
            select 1 from collection_sources
            where collection_sources.source_id = knowledge_sources.id
              and collection_sources.collection_id = ${input.filters?.collectionId ?? null}::uuid
          )
        )
        and (
          ${input.filters?.tagId ?? null}::uuid is null
          or exists (
            select 1 from source_tags
            where source_tags.source_id = knowledge_sources.id
              and source_tags.tag_id = ${input.filters?.tagId ?? null}::uuid
          )
        )
      order by chunk_embeddings.embedding <=> ${sql.raw(`'${vector}'::vector`)}
      limit ${input.limit}
    `);

    return rows;
  }

  async getDashboardSummary(input: { owner: OwnerContext }) {
    const sources = await this.listKnowledgeSources({
      limit: 6,
      owner: input.owner,
    });

    const jobs = await db
      .select({
        createdAt: ingestionJobs.createdAt,
        status: ingestionJobs.status,
      })
      .from(ingestionJobs)
      .innerJoin(
        knowledgeSources,
        eq(knowledgeSources.id, ingestionJobs.sourceId),
      )
      .where(eq(knowledgeSources.userId, input.owner.userId))
      .orderBy(desc(ingestionJobs.createdAt))
      .limit(20);

    const [defaultThread, collectionRows, tagRows] = await Promise.all([
      this.getDefaultChatThread({ owner: input.owner }),
      this.listCollections({ owner: input.owner }),
      this.listTags({ owner: input.owner }),
    ]);

    return {
      collections: collectionRows,
      defaultThread,
      ingestion: {
        failedCount: jobs.filter((job) => job.status.startsWith("failed"))
          .length,
        latestActivity: jobs[0]?.createdAt.toISOString() ?? null,
        processingCount: jobs.filter((job) => job.status === "running").length,
        queuedCount: jobs.filter((job) => job.status === "queued").length,
      },
      sources: sources.items,
      tags: tagRows,
    };
  }
}

export const knowledgeRepository = new DrizzleKnowledgeRepository();
