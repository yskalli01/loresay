# 0002. Core Data Model

**Date**: 2026-09-10
**Status**: Accepted

## Summary

Model the personal knowledge base around user owned sources, extracted content, ordered chunks, versioned embeddings, ingestion jobs, collections, tags, chat threads, retrieval runs, and answer citations. The model keeps provenance, which means every answer can trace back to the exact saved chunk that supported it. The first build should create the complete database foundation for the MVP core, while later slices add ingestion and chat behavior on top.

## Context

The app needs one durable center for private knowledge. Sources, files, extracted text, chunks, vectors, chat messages, and citations all have relationships that matter for correctness. If those relationships are left loose, the first RAG loop can answer from stale chunks, cite the wrong source, or keep deleted private content available for retrieval.

The current stack is a single Next.js app with Supabase Postgres, pgvector, Supabase Auth, Drizzle ORM, and OpenAI. The project uses Clean Architecture, so the data model should express business invariants clearly while the application layer decides how ingestion and retrieval use those tables.

This feature is foundational. It does not need to implement document parsing, URL fetching, or chatbot generation yet. It must give those later slices a schema that can store source lineage, retrieval metadata, and chat history without needing a rewrite.

## Requirements

**User stories**:

- As a signed in user, I want my saved knowledge to be stored under my account so that private sources cannot leak across users.
- As a user, I want source text, chunks, embeddings, and citations to preserve lineage so that answers can point back to the saved material.
- As a builder, I want ingestion and retrieval state recorded in structured tables so that later features can retry failures and diagnose answer quality.

**Acceptance criteria**:

- **AC-1**: The schema stores notes, documents, URLs, and future connector sources as user owned records with type, status, fingerprint, metadata, timestamps, and deletion state.
- **AC-2**: The schema stores extracted text versions, ordered chunks, and embeddings with hashes, model metadata, dimensions, and active eligibility inherited from active chunks and content so reprocessing can replace active content safely.
- **AC-3**: The schema stores ingestion jobs with status, attempt count, retryability, error details, and timing so failed processing can be retried or marked terminal.
- **AC-4**: The schema stores collections and tags as user owned organization records with many to many links to sources.
- **AC-5**: The schema stores chat threads, messages, retrieval runs, retrieval results, and answer citations so each assistant answer can show up to 20 citations tied to exact chunks, content versions, chunk hashes, and source snapshots.
- **AC-6**: The schema enforces owner scoping, uniqueness, foreign keys, deletion behavior, and practical MVP limits at the database or application boundary.
- **AC-7**: Operational metadata can record status, timings, token counts, scores, and error codes, but raw source text and full prompts are not duplicated into logs or diagnostics tables.

## Options considered

### Option 1: Minimal loop tables

Store sources, chunks, embeddings, chat messages, and citations only. Add jobs, content versions, collections, tags, and retrieval diagnostics later.

**Pros**:

- Fastest schema to write.
- Fewer tables for the first migration.

**Cons**:

- Reprocessing becomes risky because old and new chunks are hard to separate.
- Retrieval debugging and citation trust would need retrofitted tables after the first chat feature.
- Later organization features would need schema churn in the middle of product work.

### Option 2: MVP core lineage model

Store the full MVP foundation now: typed sources, content versions, chunks, embeddings, ingestion jobs, organization tables, chat history, retrieval runs, retrieval results, and citations. Keep ownership single user and defer teams, billing, sharing, and analytics.

**Pros**:

- Gives every near term slice a stable relational foundation.
- Protects provenance through reprocessing, deletion, retrieval, and citation.
- Keeps future connector details generic without adding a connector platform early.

**Cons**:

- More tables and relationships to implement in the first data migration.
- Requires careful seed data and tests so the model stays understandable.
- Some tables will exist before their full UI workflows are built.

### Option 3: Workspace ready model

Add workspace and membership tables now, with every user facing entity scoped by workspace as well as user.

**Pros**:

- Easier future upgrade to team knowledge bases.
- Authorization boundaries would be ready before any team feature ships.

**Cons**:

- Adds authorization complexity before the solo MVP needs it.
- Every early query must carry workspace context, which increases build cost.
- Team workflows are deferred in scope, so this would optimize for a later product.

### Option 4: Generic flexible metadata model

Use a small number of generic tables with JSON metadata for source kinds, processing state, retrieval data, and organization.

**Pros**:

- Flexible for unknown connector formats.
- Fewer migrations when new source metadata appears.

**Cons**:

- Harder to enforce ownership, uniqueness, limits, and required fields.
- Important query paths become JSON filtering instead of clear relational joins.
- Bugs in citation lineage are easier to hide because the schema carries less meaning.

## Decision

**Chosen option**: Option 2: MVP core lineage model

Build the core data model as a user owned relational schema for sources, content versions, chunks, embeddings, ingestion jobs, collections, tags, chats, retrieval runs, retrieval results, and answer citations.

## Rationale

This app earns trust by answering from private stored knowledge and showing where the answer came from. That makes lineage the main design force. A minimal model would be faster, but it would push source versions, retries, and retrieval diagnostics into later rewrites at exactly the point where the app needs evidence to debug answer quality.

The chosen model is larger than a demo schema, but it stays inside the MVP boundary. It defers workspaces, billing, sharing, advanced connector catalogs, and analytics. It also keeps source specific details in typed metadata where appropriate, while preserving relational ownership, constraints, and joins for the parts that must be correct.

Soft deletion is a deliberate exception to the usual preference for hard deletes or archive tables. Here, the user needs deleted sources to disappear from retrieval immediately, while file and vector purge can happen safely afterward. The model must make that state explicit with `deleted_at`, active flags, and purge oriented follow up work.

## Feature design

**Data model sketch**:

| Entity               | Key fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Relationships and constraints                                                                                                                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`           | `id uuid pk`, `display_name text nullable`, `created_at timestamptz required`, `updated_at timestamptz required`                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `id` maps to the Supabase Auth user id.                                                                                                                                                                                                                                                             |
| `knowledge_sources`  | `id uuid pk`, `user_id uuid required`, `type source_type required`, `title varchar(200) required`, `status source_status required`, `fingerprint text required`, `metadata jsonb required default {}`, `deleted_at timestamptz nullable`, `purged_at timestamptz nullable`, `created_at timestamptz required`, `updated_at timestamptz required`                                                                                                                                                                                                                     | Belongs to `profiles`. Unique active source fingerprint per `user_id`, `type`, and `fingerprint`. Owns content, chunks, jobs, collection links, and tag links.                                                                                                                                      |
| `source_contents`    | `id uuid pk`, `source_id uuid required`, `version integer required`, `text text required`, `content_hash text required`, `extracted_at timestamptz required`, `active boolean required`, `created_at timestamptz required`                                                                                                                                                                                                                                                                                                                                           | One source has many extracted versions. Unique `source_id`, `version`. Partial unique index on `source_id` where `active = true`. Text must be at most 2 MB at the application boundary.                                                                                                            |
| `source_chunks`      | `id uuid pk`, `source_content_id uuid required`, `source_id uuid required`, `position integer required`, `text text required`, `token_count integer required`, `content_hash text required`, `active boolean required`, `created_at timestamptz required`                                                                                                                                                                                                                                                                                                            | One content version has many ordered chunks. Unique `source_content_id`, `position`. Chunk text must be at most 8 KB at the application boundary.                                                                                                                                                   |
| `chunk_embeddings`   | `id uuid pk`, `chunk_id uuid required`, `provider text required`, `model text required`, `dimensions integer required`, `embedding vector required`, `content_hash text required`, `created_at timestamptz required`                                                                                                                                                                                                                                                                                                                                                 | One chunk can have embeddings for multiple models. Unique `chunk_id`, `provider`, `model`, `content_hash`. Embeddings are eligible for retrieval only through active chunks and active content, not a separate embedding flag. `dimensions` must match the vector dimensions used by the migration. |
| `ingestion_jobs`     | `id uuid pk`, `source_id uuid required`, `status ingestion_job_status required`, `attempts integer required`, `retryable boolean required`, `last_error_code text nullable`, `last_error_message text nullable`, `started_at timestamptz nullable`, `finished_at timestamptz nullable`, `created_at timestamptz required`, `updated_at timestamptz required`                                                                                                                                                                                                         | Many jobs per source. Attempts must be greater than or equal to zero. Terminal jobs are not retryable.                                                                                                                                                                                              |
| `collections`        | `id uuid pk`, `user_id uuid required`, `name varchar(200) required`, `created_at timestamptz required`, `updated_at timestamptz required`                                                                                                                                                                                                                                                                                                                                                                                                                            | User owned. Unique collection name per user.                                                                                                                                                                                                                                                        |
| `collection_sources` | `collection_id uuid required`, `source_id uuid required`, `created_at timestamptz required`                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Many to many. Composite primary key on `collection_id`, `source_id`. Source and collection must belong to the same user, enforced in application use cases and RLS policies.                                                                                                                        |
| `tags`               | `id uuid pk`, `user_id uuid required`, `name varchar(40) required`, `created_at timestamptz required`                                                                                                                                                                                                                                                                                                                                                                                                                                                                | User owned. Unique normalized tag name per user.                                                                                                                                                                                                                                                    |
| `source_tags`        | `source_id uuid required`, `tag_id uuid required`, `created_at timestamptz required`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Many to many. Composite primary key on `source_id`, `tag_id`. Source and tag must belong to the same user, enforced in application use cases and RLS policies.                                                                                                                                      |
| `chat_threads`       | `id uuid pk`, `user_id uuid required`, `title varchar(200) required`, `created_at timestamptz required`, `updated_at timestamptz required`                                                                                                                                                                                                                                                                                                                                                                                                                           | User owned. Has many messages.                                                                                                                                                                                                                                                                      |
| `chat_messages`      | `id uuid pk`, `thread_id uuid required`, `role chat_role required`, `content text required`, `created_at timestamptz required`                                                                                                                                                                                                                                                                                                                                                                                                                                       | Belongs to one thread. Role is `user`, `assistant`, or `system`. Assistant messages may have one retrieval run and many citations.                                                                                                                                                                  |
| `retrieval_runs`     | `id uuid pk`, `message_id uuid required`, `query text required`, `filters jsonb required default {}`, `prompt_context_hash text required`, `duration_ms integer nullable`, `token_count integer nullable`, `created_at timestamptz required`                                                                                                                                                                                                                                                                                                                         | One assistant message can have one retrieval run. Stores safe diagnostics only. Query text is allowed because it is a user authored chat input. Full prompts and copied retrieved context are not allowed here.                                                                                     |
| `retrieval_results`  | `id uuid pk`, `retrieval_run_id uuid required`, `chunk_id uuid required`, `rank integer required`, `score double precision required`, `created_at timestamptz required`                                                                                                                                                                                                                                                                                                                                                                                              | One retrieval run has selected chunks. Unique `retrieval_run_id`, `rank`.                                                                                                                                                                                                                           |
| `answer_citations`   | `id uuid pk`, `message_id uuid required`, `chunk_id uuid nullable`, `source_id_snapshot uuid required`, `source_type_snapshot source_type required`, `source_title_snapshot varchar(200) required`, `source_fingerprint_snapshot text required`, `source_content_id_snapshot uuid required`, `content_version_snapshot integer required`, `chunk_position_snapshot integer required`, `chunk_hash_snapshot text required`, `location_snapshot jsonb required default {}`, `quote varchar(1000) nullable`, `rank integer required`, `created_at timestamptz required` | One assistant message has up to 20 citations. Citations snapshot enough data to remain understandable after source metadata changes or physical purge. `chunk_id` can become null during purge, but snapshot fields remain.                                                                         |

**Source type rules**:

| Source type | Required metadata                                                                       | Fingerprint source                                    | Title source                                                | Initial status                                               |
| ----------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `note`      | `note_id`, `body_hash`                                                                  | Stable note id generated by the app                   | User input, else first 80 chars of note body                | `ready` when content is saved and chunked, otherwise `draft` |
| `document`  | `storage_bucket`, `storage_path`, `file_name`, `mime_type`, `byte_size`, `file_hash`    | File hash scoped to the user                          | User input, else uploaded file name                         | `processing` after upload                                    |
| `url`       | `original_url`, `canonical_url`, `url_hash`                                             | Normalized canonical URL hash scoped to the user      | User input, else page title after extraction, else hostname | `processing` after save                                      |
| `connector` | `connector_key`, `external_id`, `external_updated_at` nullable, `external_url` nullable | `connector_key` plus `external_id` scoped to the user | User input, else connector supplied title                   | `processing` after import                                    |

URL canonicalization lowercases scheme and host, removes fragments, normalizes trailing slashes, and preserves query strings unless a later connector spec defines provider specific rules. Metadata JSON is limited to 16 KB at the application boundary.

**State transitions**:

| State machine              | Valid transitions                                                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `knowledge_sources.status` | `draft` to `processing`, `processing` to `ready`, `processing` to `failed`, `failed` to `processing`, any non deleted state to `deleted`, `deleted` to `purged`      |
| `ingestion_jobs.status`    | `queued` to `running`, `running` to `succeeded`, `running` to `failed_retryable`, `failed_retryable` to `queued`, `running` to `failed_terminal`                     |
| `source_contents.active`   | new content starts inactive, becomes active only after chunks and embeddings are ready, previous active content becomes inactive in the same application transaction |
| `source_chunks.active`     | mirrors its content version, active chunks are eligible for retrieval only when the source is `ready` and not deleted                                                |
| physical purge             | deleted source content, chunks, files, and vectors may be removed after purge; answer citations retain snapshot fields and may null `chunk_id`                       |

**API surface**:

| Endpoint or action       | Method               | Key inputs                                                                                  | Key outputs                                                                                | Auth                               | Key errors                                                                                   |
| ------------------------ | -------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `createKnowledgeSource`  | Server action        | `type` required, `title` optional, `metadata` required by type                              | source summary DTO with `source_id`, `type`, `title`, `status`, `created_at`, `updated_at` | authenticated owner                | duplicate active source, invalid source type, invalid metadata, invalid title                |
| `recordExtractedContent` | Application use case | `source_id` required, `text` required, `content_hash` required                              | `content_id`, `version`                                                                    | server only, owner scoped          | source not found, source deleted, text too large                                             |
| `replaceActiveChunks`    | Application use case | `content_id` required, `chunks[]` required, `embedding_model` required                      | active chunk ids ordered by position, inactive previous content id                         | server only, owner scoped          | content not found, embedding dimensions mismatch, concurrent activation, transaction failure |
| `createIngestionJob`     | Application use case | `source_id` required, `status` required                                                     | `job_id`, `status`                                                                         | server only, owner scoped          | source not found, invalid transition                                                         |
| `listKnowledgeSources`   | Server action        | `cursor` optional, `limit` optional, `filters` optional                                     | `{ items, next_cursor }` ordered by `updated_at desc`, then `id desc`                      | authenticated owner                | invalid cursor, invalid filter                                                               |
| `createChatThread`       | Server action        | `title` optional                                                                            | `thread_id`, `title`                                                                       | authenticated owner                | invalid title                                                                                |
| `recordChatMessage`      | Application use case | `thread_id` required, `role` required, `content` required                                   | `message_id`, `created_at`                                                                 | authenticated owner or server only | thread not found, invalid role, content too large                                            |
| `recordRetrievalRun`     | Application use case | `assistant_message_id` required, `query` required, `filters` optional, `results[]` required | `retrieval_run_id`, selected chunk DTOs ordered by rank                                    | server only, owner scoped          | message not found, chunk not active, cross user chunk                                        |
| `recordAnswerCitations`  | Application use case | `assistant_message_id` required, `citations[]` required                                     | citation DTOs ordered by rank                                                              | server only, owner scoped          | more than 20 citations, duplicate rank, chunk not active, cross user chunk                   |

**Value sourcing**:

| Action                   | Value produced or displayed                       | Source                                                                                                                                          |
| ------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Create source            | `user_id`                                         | Supabase server session, never client input                                                                                                     |
| Create source            | `type`, `metadata`                                | Validated action input and source type rules                                                                                                    |
| Create source            | `title`                                           | Validated action input, else the title source from the source type rules                                                                        |
| Create source            | `fingerprint`                                     | Derived from source type rules, never arbitrary client input                                                                                    |
| Create source            | `status`                                          | Source type rules and whether processing starts immediately                                                                                     |
| Create source            | duplicate detection                               | `user_id`, `type`, `fingerprint`, and `deleted_at` from `knowledge_sources`                                                                     |
| Record extracted content | `version`                                         | Previous max `source_contents.version` for the source plus one inside the same database transaction, protected by unique `source_id`, `version` |
| Record extracted content | `content_hash`                                    | Hash of extracted text supplied by the extraction use case                                                                                      |
| Record extracted content | `extracted_at`                                    | Server clock at successful extraction completion                                                                                                |
| Replace chunks           | `position`, `text`, `token_count`, `content_hash` | Chunker output from the application use case                                                                                                    |
| Replace chunks           | `provider`, `model`, `dimensions`, `embedding`    | Embedding provider response and model config                                                                                                    |
| Replace chunks           | active embedding eligibility                      | Derived from active source, active content, and active chunk rows                                                                               |
| List sources             | `items`                                           | `knowledge_sources` plus collection and tag labels scoped by session user                                                                       |
| List sources             | label order                                       | Collections by `name asc`, tags by `name asc`                                                                                                   |
| List sources             | pagination cursor                                 | Opaque encoding of last `updated_at` and `id` from the prior page                                                                               |
| Create chat thread       | default title                                     | Explicit title input, else `"New chat"`                                                                                                         |
| Record retrieval run     | `query`, `filters`, `prompt_context_hash`         | Chat application use case input                                                                                                                 |
| Record retrieval result  | `rank`, `score`, `chunk_id`                       | Retrieval algorithm output after owner scoped filtering, rank starts at 1                                                                       |
| Record citation          | source and content snapshots                      | Selected chunk, active content version, and source metadata at answer time                                                                      |
| Record citation          | `location_snapshot`, `quote`, `rank`              | Answer citation builder output, rank starts at 1                                                                                                |
| Enforce citation limit   | citation count                                    | Length of validated citation input, maximum 20                                                                                                  |
| Operational diagnostics  | duration, token count, status, error code         | Application timers, model usage metadata, and typed error handling                                                                              |

**Key invariants**:

- Every user visible table is scoped to one Supabase user through `user_id` directly or through an owned parent row.
- Server side code must never accept `user_id` from client input.
- Active retrieval can only use chunks whose source is `ready`, whose source has no `deleted_at`, whose content is active, and whose chunk is active.
- Active embedding eligibility is inherited through active chunks and active content.
- Reprocessing must activate the new content and chunks only after extraction, chunking, and embeddings succeed.
- A source can have only one active content version, enforced by a partial unique index.
- Version allocation and active replacement must happen inside one database transaction.
- A source can have only one active fingerprint for a user and source type.
- Joins for collections and tags may only connect records that belong to the same user.
- Assistant messages can have no more than 20 citations, ranks must be 1 through 20, and ranks must be unique per message.
- Diagnostics must not duplicate raw source text or full prompts outside the content, chunk, message, and retrieval query tables that require them.
- Practical limits at the application boundary are title 200 chars, tag 40 chars, metadata JSON 16 KB, note or extracted text 2 MB, chat message text 32 KB, chunk text 8 KB, chunks per source 2000, retrieval results per answer 50, citations per answer 20, and citation quote 1000 chars.

**Security model**:

All source, organization, chat, retrieval, and citation reads and writes are owner scoped. Application use cases resolve the owner from the Supabase server session, then pass that owner context into repositories. Supabase row level security should enforce the same owner boundary at the database layer. Tables with direct `user_id` use direct owner policies. Child tables without direct `user_id` use parent chain policies through their owning source, collection, tag, thread, message, or retrieval run. Join table writes must validate same user ownership in application code before insert.

Foreign keys should cascade inside one owned aggregate when historical snapshots are not needed. Content, chunks, embeddings, jobs, collection links, and tag links may cascade during physical purge. Answer citations should not cascade from chunks during purge. Their `chunk_id` can be set null, while snapshot fields remain. Chat threads and messages are deleted only by a later privacy lifecycle feature, not by source purge.

Private knowledge text is sensitive personal data. The model stores it only where the product needs it: extracted content, chunks, chat messages, retrieval query text, and optional citation quotes. Operational metadata can store states, timings, token counts, scores, and error codes, but must not store full prompts or copied retrieved context.

**Critical test scenarios**:

- Happy path: create a note source, record content, chunks, embeddings, a chat answer, a retrieval run, and citations under one user, verifies **AC-1**, **AC-2**, **AC-5**.
- Reprocessing case: replacing active content creates a new version and makes the old content and chunks inactive only after the new embeddings are ready, verifies **AC-2**.
- Failure case: a retryable ingestion failure records attempt count, error details, and retryable status, while a terminal failure cannot be retried, verifies **AC-3**.
- Organization case: a source can belong to many collections and tags owned by the same user, verifies **AC-4**.
- Auth case: one user cannot read or attach another user's source, chunk, tag, collection, chat thread, retrieval result, or citation, verifies **AC-6**.
- Privacy case: diagnostic rows record timing, token count, scores, and error codes without storing copied source text or full prompts, verifies **AC-7**.
- Purge case: purging a deleted source removes retrievable content and vectors while existing answer citations keep snapshot fields, verifies **AC-5**, **AC-6**.
- Concurrency case: two reprocessing attempts for one source cannot both create the same version or leave two active content versions, verifies **AC-2**, **AC-6**.

## Build plan

1. Create shared domain enums and value constraints for source types, source type metadata rules, source states, job states, chat roles, DTO shapes, limits, rank ranges, and ownership identifiers, satisfies **AC-1**, **AC-3**, **AC-5**, **AC-6**.
2. Create the Drizzle schema and migration for profiles, knowledge sources, source contents, chunks, embeddings, and ingestion jobs, with keys, indexes, constraints, active flags, partial unique indexes, FK purge behavior, and pgvector support, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
3. Add repository interfaces and application use cases for creating sources, recording content versions, replacing active chunks, creating ingestion jobs, and listing paginated source summaries, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
4. Add the organization schema and use cases for collections, tags, and their source join tables with same user validation, satisfies **AC-4**, **AC-6**.
5. Add chat, retrieval, retrieval result, and citation schema plus use cases for recording messages, retrieval runs, selected chunks, answer citations, citation snapshots, and purge safe citation behavior, satisfies **AC-5**, **AC-6**, **AC-7**.
6. Add database policy scaffolding or migration notes for owner scoped row level security on direct owner tables and parent chain policies on child tables, satisfies **AC-6**.
7. Add unit and integration tests for invariants, state transitions, ownership checks, reprocessing concurrency, citation limits, purge safe citation snapshots, and private safe diagnostics, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.

## Consequences

**Positive**:

- Later ingestion and chat features can build on a stable model instead of inventing storage during product work.
- Citation lineage is explicit from answer to chunk to source content to source.
- Failed ingestion and answer quality diagnostics have structured places to live.

**Negative / tradeoffs**:

- The first migration is larger than a tiny demo schema.
- More relationships mean tests are required before application behavior is built on top.
- Soft deletion and active flags add query discipline, because every retrieval path must filter them correctly.

**Neutral**:

- Team workspaces remain deferred. Adding them later will require a new ownership spec and migration.
- Connector specific fields stay in source metadata until the connector framework spec decides a stronger shape.
- Analytics events are not part of this model beyond private safe operational metadata.

## Follow-up

- [ ] Design the thin knowledge loop after this lands so the first source, chunk, retrieval, and citation path can use the model directly.
- [ ] Design privacy controls and data lifecycle before building physical purge, export, or account deletion behavior.
