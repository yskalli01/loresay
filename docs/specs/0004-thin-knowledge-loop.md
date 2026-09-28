# 0004. Thin Knowledge Loop

**Date**: 2026-09-11
**Status**: Accepted

## Summary

Build the first real path through the product. A signed in user can save a plain text note, the app chunks and embeds it, then the user can ask a question and receive an answer with citations back to saved text. The slice reuses the existing Supabase data model, keeps processing inline for small notes, and proves retrieval augmented generation, which means answers are grounded in stored content.

## Context

The app has a stack, a core data model, and a UI foundation. It does not yet have the product loop that makes the knowledge base useful: sign in, save knowledge, retrieve it, ask a question, and see a cited answer.

This feature is the first vertical slice through every layer. It must touch Supabase Auth, owner scoped tables, chunking, embeddings, vector retrieval, OpenAI answer generation, persisted chat records, and the dashboard UI. The build should stay intentionally narrow so later document, URL, organization, and answer quality work can build on a proven path instead of a placeholder.

The existing schema already has the needed records: profiles, knowledge sources, source contents, source chunks, chunk embeddings, ingestion jobs, chat threads, chat messages, retrieval runs, retrieval results, and answer citations. The main decision is how much behavior to wire now without widening the product into full note editing, document ingestion, source filtering, or advanced answer quality.

The repo uses Clean Architecture, so domain rules stay free of Next.js, Supabase, OpenAI, and Vercel AI SDK imports. Supabase row level security remains the database backstop for private user data, while server code still authenticates and authorizes every action.

## Requirements

**User stories**:

1. As a new user, I want to sign up or sign in so that my saved knowledge is private to my account.
2. As a signed in user, I want to save one text note so that I can ask questions about it later.
3. As a signed in user, I want the app to process that note into retrievable chunks so that the chatbot can ground answers in my saved text.
4. As a signed in user, I want to ask a question and receive a streamed answer with citations so that I can trust where the answer came from.
5. As a signed in user, I want unsupported questions to be handled honestly so that the app does not pretend my saved knowledge says something it does not.

**Acceptance criteria**:

1. **AC-1**: A user can sign up, sign in, sign out, and reach the authenticated workspace with Supabase email and password auth.
2. **AC-2**: A signed in user can submit a plain text note with an optional title, creating a new note source every time.
3. **AC-3**: Submitted notes are processed inline when the body is 20,000 characters or fewer, with extracted content, chunks, embeddings, and source status updated to ready when processing succeeds.
4. **AC-4**: Processing failures show an inline error, record an ingestion failure, and leave the source in failed status without exposing private note text in logs or diagnostics.
5. **AC-5**: A signed in user can ask one default chat thread a question and receive a streamed answer based on ready sources owned by that user.
6. **AC-6**: Retrieval searches all ready chunks owned by the signed in user, ranks matching chunks, records the retrieval run and selected results, and uses up to 5 citations in the answer UI.
7. **AC-7**: If retrieved chunks do not support an answer, the assistant says the saved knowledge does not contain enough information and does not fabricate a citation.
8. **AC-8**: Chat messages, answer text, retrieval metadata, and citation snapshots are persisted under the signed in user's ownership.
9. **AC-9**: Owner scoping is enforced in server logic and Supabase row level security so one user cannot read, retrieve, cite, or chat against another user's knowledge.

## Options considered

### Option 1: Note only inline loop

Build the smallest real loop around Supabase email and password auth, one plain text note form, inline chunking and embedding for small note bodies, one default streamed chat thread, and citations from all ready sources owned by the user.

**Pros**:

1. Proves the full product path with the fewest moving parts.
2. Reuses the existing schema instead of adding queues or new tables.
3. Keeps failure cases easy to see in the UI during the first build.

**Cons**:

1. Inline processing is not suitable for large documents or slow extraction.
2. There is no full note editor, source picker, or chat thread management yet.

### Option 2: Queued ingestion first

Create notes quickly, enqueue ingestion jobs, and process chunks and embeddings asynchronously before chat can use them.

**Pros**:

1. More scalable for later documents and URL extraction.
2. Makes retry behavior explicit from the start.

**Cons**:

1. Adds worker or polling complexity before the first product loop is proven.
2. Makes the first user flow harder to verify end to end.

### Option 3: Chat over unpersisted note context

Let the user paste text into a chat prompt and answer from that immediate context without storing chunks, embeddings, retrieval runs, or citations.

**Pros**:

1. Fastest way to show a chatbot response.
2. Avoids vector search and persistence work in the first screen.

**Cons**:

1. Does not prove the knowledge base architecture.
2. Skips citation lineage, owner scoped retrieval, and the existing data model.
3. Creates throwaway behavior that later slices would need to replace.

### Option 4: Full note and chat product

Build note editing, source detail pages, source filters, chat thread management, answer feedback, and richer citation controls in one slice.

**Pros**:

1. Closer to the eventual product experience.
2. Reduces some follow up work for later slices.

**Cons**:

1. Too broad for the first vertical slice.
2. Makes it harder to isolate retrieval, citation, and authorization defects.

## Decision

**Chosen option**: Option 1: Note only inline loop

Build a real but narrow end to end loop: Supabase email and password auth, a plain text note form, inline chunking and embedding for note bodies up to 20,000 characters, vector retrieval across the user's ready sources, a streamed answer route, and persisted citations.

**Implementation skills**: `supabase` (`supabase/supabase`, `.agents/skills/supabase/`) · `supabase-postgres-best-practices` (`supabase/supabase-postgres-best-practices`, `.agents/skills/supabase-postgres-best-practices/`)

## Rationale

The recommended path is the right tracer bullet for this project. It crosses every important boundary once, but it does not pretend to solve document ingestion, URL fetching, note editing, or answer quality diagnostics in the same slice.

Inline processing is acceptable here because the input is capped and the user is waiting on a simple note. The cost is that this path must not become the general ingestion architecture for large files. Future document and URL ingestion should move through queued jobs once extraction and retry behavior matter.

The feature should use `text-embedding-3-small` for embeddings because the current schema is fixed at 1536 vector dimensions and the model is available on the OpenAI embeddings endpoint. It should use `gpt-5.6-terra` for answers because official OpenAI model guidance positions it as the balanced choice for intelligence and cost. The runner up is `gpt-5.6-luna`, which is cheaper but less appropriate while the team is still proving answer quality.

## Feature design

**Data model sketch**:

No new tables are required. This slice writes to the existing schema from spec 0002.

| Entity              | Fields used by this slice                                                                                                                                    | Relationship and constraints                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `profiles`          | `id required`, `display_name nullable`                                                                                                                       | `id` is the Supabase Auth user id. A profile must exist before user owned records are written. |
| `knowledge_sources` | `user_id required`, `type note`, `title required`, `status draft, processing, ready, failed`, `fingerprint required`, `metadata required`                    | Belongs to `profiles`. A new note source is created for every submit.                          |
| `source_contents`   | `source_id required`, `version required`, `text required`, `content_hash required`, `active required`                                                        | One active content version per note source after inline processing succeeds.                   |
| `source_chunks`     | `source_content_id required`, `source_id required`, `position required`, `text required`, `token_count required`, `content_hash required`, `active required` | Chunks are ordered and active only for the current content version.                            |
| `chunk_embeddings`  | `chunk_id required`, `provider OpenAI`, `model text-embedding-3-small`, `dimensions 1536`, `embedding required`, `content_hash required`                     | One embedding per chunk, model, and content hash.                                              |
| `ingestion_jobs`    | `source_id required`, `status required`, `attempts required`, `retryable required`, `last_error_code nullable`, `last_error_message nullable`                | Records inline processing success or failure even though no worker is used yet.                |
| `chat_threads`      | `user_id required`, `title required`                                                                                                                         | One default thread may be created lazily for the user.                                         |
| `chat_messages`     | `thread_id required`, `role user or assistant`, `content required`                                                                                           | Stores the question and final assistant answer.                                                |
| `retrieval_runs`    | `message_id required`, `query required`, `filters required`, `prompt_context_hash required`, `duration_ms nullable`, `token_count nullable`                  | One retrieval run for each assistant answer attempt.                                           |
| `retrieval_results` | `retrieval_run_id required`, `chunk_id required`, `rank required`, `score required`                                                                          | Stores ranked selected chunks, capped by existing retrieval limits.                            |
| `answer_citations`  | `message_id required`, `chunk_id nullable`, source snapshot fields, `quote nullable`, `rank required`                                                        | Stores up to 5 citations for this UI, within the existing 20 citation table limit.             |

**State transitions**:

| Record                     | Transitions                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `knowledge_sources.status` | `draft` to `processing` to `ready`, or `draft` to `processing` to `failed`                                |
| `ingestion_jobs.status`    | `queued` to `running` to `succeeded`, or `queued` to `running` to `failed_retryable` or `failed_terminal` |
| Note form                  | idle to submitting to success, or idle to submitting to error                                             |
| Chat answer                | idle to retrieving to streaming to complete, or idle to retrieving to error                               |

**API surface**:

| Endpoint or action                  | Method                       | Key inputs                           | Key outputs                                     | Auth      | Key errors                                                                                |
| ----------------------------------- | ---------------------------- | ------------------------------------ | ----------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `signUpWithPassword` server action  | POST through Server Action   | email required, password required    | user session or field errors                    | public    | invalid email, weak password, provider error                                              |
| `signInWithPassword` server action  | POST through Server Action   | email required, password required    | user session or field errors                    | public    | invalid credentials, provider error                                                       |
| `signOut` server action             | POST through Server Action   | none                                 | redirect to signed out screen                   | signed in | provider error                                                                            |
| `createTextNote` server action      | POST through Server Action   | title optional, body required        | source id, status, chunk count                  | signed in | body too large, duplicate active fingerprint from unexpected collision, embedding failure |
| `getKnowledgeDashboard` server read | GET through Server Component | cursor optional, limit optional      | source summaries, ingestion summary, chat entry | signed in | unauthorized, repository error                                                            |
| `/api/chat` route handler           | POST                         | message required, thread id optional | streamed answer events with citations           | signed in | empty message, no ready sources, retrieval failure, model failure                         |

**Value sourcing**:

| Action            | Value produced or displayed    | Source                                                                                   |
| ----------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| Sign up           | user id                        | Supabase Auth response                                                                   |
| Sign up           | profile id                     | Supabase Auth user id copied into `profiles.id`                                          |
| Sign in           | session user id                | Supabase server session                                                                  |
| Create note       | owner user id                  | Supabase server session                                                                  |
| Create note       | source type                    | This spec fixes it to `note`                                                             |
| Create note       | note title                     | Optional title input, else derived from the first non empty body text                    |
| Create note       | body text                      | Body input, capped at 20,000 characters                                                  |
| Create note       | note fingerprint               | Newly generated note id stored in note metadata                                          |
| Create note       | body hash                      | Hash of normalized body text                                                             |
| Create note       | content hash                   | Hash of stored extracted text                                                            |
| Process note      | chunks                         | Deterministic chunker using about 800 tokens per chunk and 120 token overlap             |
| Process note      | token count                    | Chunker estimate used consistently for limits and metadata                               |
| Process note      | embeddings                     | OpenAI embeddings response for each chunk                                                |
| Process note      | embedding model and dimensions | This spec fixes model to `text-embedding-3-small` and dimensions to 1536                 |
| Process note      | source status                  | Application transition result, then `knowledge_sources.status`                           |
| Dashboard         | source summaries               | `knowledge_sources` rows owned by the session user                                       |
| Dashboard         | ingestion status               | `ingestion_jobs` joined through owned sources                                            |
| Chat request      | thread id                      | Input thread id if owned by user, else lazily created default thread                     |
| Chat request      | user message                   | Message input stored in `chat_messages.content`                                          |
| Retrieval         | query embedding                | OpenAI embedding of the user message                                                     |
| Retrieval         | candidate chunks               | Active chunks joined to ready sources owned by the session user                          |
| Retrieval         | rank and score                 | Vector distance query result                                                             |
| Answer generation | prompt context                 | Top retrieved chunks, source titles, and chunk positions                                 |
| Answer generation | answer model                   | This spec fixes it to `gpt-5.6-terra`                                                    |
| Answer generation | unsupported answer decision    | The answer service must choose refusal when retrieved chunks do not support the question |
| Citations         | citation rank                  | Order of chunks cited by the final answer, capped at 5                                   |
| Citations         | citation quote                 | Short excerpt from cited chunk text                                                      |
| Citations         | source snapshot fields         | Source, content, and chunk rows at answer time                                           |

**Key invariants**:

1. Every user owned write derives `user_id` from the server session, never from client input.
2. Plain text note bodies over 20,000 characters are rejected before source creation.
3. Every submitted note creates a new note source. Matching title or matching body does not overwrite an existing note.
4. A source is `ready` only after active content, active chunks, and embeddings are written successfully.
5. A failed inline process records an ingestion failure and sets the source status to `failed`.
6. Retrieval only considers active chunks from ready, non deleted sources owned by the signed in user.
7. The answer UI shows at most 5 citations, even though the database can store up to 20.
8. Unsupported answers must not create fabricated citations.
9. Logs and diagnostics must not include raw note body text or full prompts.

**Security model**:

All knowledge, chat, retrieval, and citation records are private to the signed in Supabase user. Server actions and route handlers must authenticate through the Supabase server session, then read and write only through owner scoped repository methods. Row level security remains enabled on all public tables and must use owner predicates. For direct owner tables this means the row `user_id` must match the authenticated user. For child tables this means ownership is inherited through the parent source or chat thread.

The feature handles private personal data, but it does not introduce a named regulatory compliance program such as HIPAA or PCI. The baseline is private by default, no cross user access, no raw private text in logs, and no client supplied ownership.

**Configuration required**:

No new environment variables are required. The feature uses the existing `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `DATABASE_URL`.

**Critical test scenarios**:

1. Happy path: a new user signs up, saves a text note, sees it become ready, asks a question, receives a streamed answer, and sees at least one citation, verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**, and **AC-8**.
2. Failure case: embedding or model failure during note processing shows an inline error, records a failed ingestion job, and marks the source failed without logging note text, verifies **AC-4**.
3. Unsupported case: a question unrelated to saved notes returns the not enough information response and no fabricated citation, verifies **AC-7**.
4. Auth and ownership: user B cannot list, retrieve, cite, or chat against user A's source by guessing ids or calling the route directly, verifies **AC-9**.
5. Limit case: a note body over 20,000 characters is rejected before source creation, verifies **AC-3** and **AC-4**.

## Build plan

1. [x] Wire Supabase email and password auth screens and server actions, ensure profile creation for signed in users, and protect the workspace shell, satisfies **AC-1** and **AC-9**.
2. [x] Build the thinnest note save path through the existing repository: server action, validation, note source creation, content write, deterministic chunking, OpenAI embeddings, active chunk replacement, ingestion job records, and ready or failed status, satisfies **AC-2**, **AC-3**, and **AC-4**.
3. [x] Replace the placeholder dashboard data with signed in source summaries, ingestion summary, and inline note form states, satisfies **AC-2**, **AC-3**, **AC-4**, and **AC-9**.
4. [x] Build the thinnest chat path: default thread creation, user message persistence, owner scoped vector retrieval across ready sources, retrieval run and result persistence, streamed OpenAI answer generation, assistant message persistence, and citation snapshots, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**, and **AC-9**.
5. [x] Add focused verification and tests for auth, note processing, retrieval ownership, unsupported answers, citation rendering, and private text logging boundaries, satisfies **AC-1** through **AC-9**.

## Consequences

**Positive**:

1. The project gets one real working loop through auth, database, vector search, OpenAI, chat, and citations.
2. Later ingestion slices can reuse the same source, content, chunk, embedding, retrieval, and citation path.
3. The app stops being a placeholder shell and begins exercising the actual privacy and provenance model.

**Negative / tradeoffs**:

1. Inline note processing can time out or feel slow if the implementation lets inputs grow beyond the chosen cap.
2. The first chat experience has no thread list, source picker, note editing, or answer feedback.
3. Hard coding model names keeps the first build simple, but changing models later requires a code change and possibly a migration if embedding dimensions change.

**Neutral**:

1. This spec does not add document parsing, URL fetching, connector ingestion, collection filtering, or source detail pages.
2. Existing RLS policies may need small performance edits to wrap `auth.uid()` in `select` and add any missing indexes, but the ownership model itself is unchanged.

## Follow-up

1. Document ingestion should replace inline processing with queued extraction and retry behavior for files.
2. Grounded answer quality should add retrieval diagnostics, stricter refusal evaluation, and answer feedback after this loop is proven.
3. Consider configurable model names once the first loop is stable and there is a real need to tune cost, quality, or embedding dimensions.
