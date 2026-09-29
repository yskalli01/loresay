# 0005. Privacy And Data Lifecycle

**Date**: 2026-09-28
**Status**: Implemented

## Summary

Add a clear privacy lifecycle around saved knowledge. A signed in user can export their owned knowledge, permanently purge an archived source, and see deletion behavior that matches the trust promise of a private knowledge base. The first build keeps account deletion out of the critical path, but prepares the data model and repository boundaries so account deletion can reuse the same purge rules later.

## Context

> Premise note: Privacy lifecycle can sprawl into source deletion, account deletion, export, audit logs, storage purge, and legal retention. This spec focuses on source export and source purge first, because they are the smallest useful trust slice. Account deletion stays as a follow up that should reuse the same purge service once source purge is proven.

The MVP already has soft archive behavior for sources. Archiving sets `knowledge_sources.deleted_at`, marks status `deleted`, and makes chunks inactive so retrieval no longer sees them. That is the right immediate user experience, but it is not the same as permanent removal.

The existing data model anticipated physical purge. Sources already have `purged_at`, source status includes `purged`, answer citations can keep snapshot fields after `chunk_id` becomes null, and source child tables cascade inside the owned aggregate. The missing decision is how to expose this safely without breaking citations, retrieval history, owner isolation, or later account deletion.

This feature handles private user content. There is no named regulatory program in scope yet, but the product promise is private by default. The build must avoid logging raw source text, must keep owner scoped operations, and must make destructive operations explicit.

## Requirements

**User stories**:

- As a signed in user, I want to export my saved knowledge so that I can keep a copy outside the app.
- As a signed in user, I want to permanently purge an archived source so that private source text and vectors are removed from active storage.
- As a signed in user, I want previous chat citations to remain understandable after purge so that old answers do not become confusing.
- As a builder, I want purge behavior centralized so that later account deletion can reuse the same deletion rules.

**Acceptance criteria**:

- **AC-1**: A signed in user can export all owned sources, active extracted content, collections, tags, chat messages, retrieval run metadata, and citation snapshots as one JSON response or download.
- **AC-2**: Export output includes archived sources but marks their status and timestamps clearly. It excludes raw embedding vectors and any deleted source content that has already been purged.
- **AC-3**: A signed in user can permanently purge only a source they own and only after it has been archived.
- **AC-4**: Purging removes source content, chunks, embeddings, ingestion jobs, collection links, tag links, and retrieval result links for that source, then marks the source `purged` with `purged_at`.
- **AC-5**: Purging keeps answer citation snapshot fields readable and sets any citation `chunk_id` reference to null through the existing foreign key behavior.
- **AC-6**: Purged sources never appear in source lists, source detail pages, chat retrieval, filters, retry actions, or edit actions.
- **AC-7**: Cross user export and purge attempts are denied by server logic and remain denied by Supabase row level security.
- **AC-8**: Destructive purge actions use an explicit confirmation value and return clear success or failure states in the UI.
- **AC-9**: Tests cover export redaction, purge ownership, purge state transitions, citation snapshot survival, and retrieval exclusion.

## Options considered

### Option 1: Soft archive only

Keep the current archive behavior and do not add physical purge yet.

**Pros**:

- Fastest path because the current code already works.
- Preserves all historical data for debugging and citation lineage.

**Cons**:

- Does not satisfy a user's expectation that private source text can be removed.
- Leaves account deletion with no proven lower level purge behavior to reuse.

### Option 2: Source export plus explicit source purge

Add export for owned data and add a deliberate purge action that only works after archive. Keep citation snapshots while deleting source content, chunks, embeddings, jobs, and organization links.

**Pros**:

- Matches the current data model and existing `deleted` to `purged` state transition.
- Gives users a real privacy control without widening into full account deletion.
- Proves the hardest data lifecycle rule before account deletion reuses it.

**Cons**:

- Adds destructive behavior that needs careful tests and confirmation UI.
- Old retrieval runs may lose live chunk links, so the UI must rely on stored citation snapshots for history.

### Option 3: Full account deletion now

Build source purge, chat deletion, profile deletion, Supabase Auth user deletion, and any storage cleanup in one slice.

**Pros**:

- Gives the strongest privacy story in one feature.
- Forces every retention decision to be made now.

**Cons**:

- Too broad for the next post MVP slice.
- Auth user deletion and session invalidation involve Supabase Auth behavior beyond the current repository boundary.
- Harder to verify safely because one workflow touches every owned aggregate.

### Option 4: Scheduled purge job

Keep archive as the user action and purge archived sources automatically after a retention window.

**Pros**:

- Reduces manual user work after archive.
- Establishes a retention policy early.

**Cons**:

- Requires background scheduling that the app has not introduced yet.
- A retention timer is a product policy decision that has not been validated.

## Decision

**Chosen option**: Option 2: Source export plus explicit source purge

Build source export and explicit source purge around the existing ownership, source status, citation snapshot, and cascade model.

**Implementation skills**: `supabase` (`supabase/supabase`, `.agents/skills/supabase/`) · `supabase-postgres-best-practices` (`supabase/supabase-postgres-best-practices`, `.agents/skills/supabase-postgres-best-practices/`)

## Rationale

Option 2 is the right next step because it turns the existing lifecycle model into a user visible privacy control without adding a scheduler, a worker, or full account deletion. It uses the states and foreign keys the schema already has, so the build is mostly a repository and UI enhancement rather than a new platform.

The key tradeoff is citation history. Purge should remove private source text and vectors, but answer citations already store safe snapshots so old answers can remain understandable. That means purge must break live chunk links while preserving citation snapshot fields.

Full account deletion should wait until source purge is proven. Account deletion has extra concerns, including Supabase Auth user removal, session behavior, and chat history retention. Those decisions are easier and safer after source purge has a tested service boundary.

## Feature design

**Data model sketch**:

| Entity                                 | Key fields                                                        | Relationship and constraints                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `knowledge_sources`                    | existing `status`, `deleted_at`, `purged_at`                      | A source can move from `deleted` to `purged`. Purge keeps the source row as a tombstone with no active content. |
| `source_contents`                      | existing `source_id`, `text`, `active`                            | Rows for the purged source are physically deleted.                                                              |
| `source_chunks`                        | existing `source_id`, `source_content_id`, `text`, `active`       | Rows for the purged source are physically deleted. Cascades delete embeddings and retrieval results.            |
| `chunk_embeddings`                     | existing `chunk_id`, `embedding`                                  | Rows are deleted through chunk cascade. Raw vectors are never exported.                                         |
| `ingestion_jobs`                       | existing `source_id`, status fields, safe error metadata          | Rows for the purged source are deleted. Export may include safe job metadata before purge.                      |
| `collection_sources` and `source_tags` | existing source links                                             | Rows for the purged source are deleted.                                                                         |
| `answer_citations`                     | existing snapshot fields, nullable `chunk_id`                     | Rows remain. `chunk_id` becomes null when the chunk is deleted. Snapshot fields remain readable.                |
| Export DTO                             | source, content, organization, chat, retrieval, citation sections | Plain object assembled by application code. No new table required.                                              |

No new table is required for this slice. A later audit log can add a dedicated event table if the product needs administrator review or compliance evidence.

**State transitions**:

| State machine    | Valid transitions                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Source lifecycle | `ready` or `failed` to `deleted` through archive, then `deleted` to `purged` through explicit purge |
| Purge action     | idle to confirming to purging to success, or idle to confirming to error                            |
| Export action    | idle to preparing to downloaded, or idle to preparing to error                                      |

**API surface**:

| Endpoint or action                      | Method                          | Key inputs                                                     | Key outputs                              | Auth                      | Key errors                                                                 |
| --------------------------------------- | ------------------------------- | -------------------------------------------------------------- | ---------------------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `exportKnowledgeAction`                 | Server Action or route download | none for full export                                           | JSON export payload, generated timestamp | signed in owner           | unauthorized, export failed                                                |
| `purgeSourceAction`                     | Server Action                   | `source_id` required, typed source title confirmation required | success message and redirect to sources  | signed in owner           | source not found, source not archived, confirmation mismatch, purge failed |
| `exportOwnedKnowledge`                  | Application use case            | owner context                                                  | export DTO                               | server only, owner scoped | repository error                                                           |
| `purgeArchivedSource`                   | Application use case            | owner context, source id                                       | purged source id and timestamp           | server only, owner scoped | source not found, invalid state                                            |
| `purgeArchivedSource` repository method | Database transaction            | owner context, source id                                       | purged timestamp                         | owner scoped SQL plus RLS | concurrent state change, transaction failure                               |

**Value sourcing**:

| Action           | Value produced or displayed | Source                                                                                             |
| ---------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| Export knowledge | export owner                | Supabase server session user id                                                                    |
| Export knowledge | generated timestamp         | server clock at export time                                                                        |
| Export knowledge | source summaries            | `knowledge_sources` rows scoped by owner                                                           |
| Export knowledge | active content text         | active `source_contents.text` rows for non purged sources                                          |
| Export knowledge | organization labels         | `collections`, `tags`, and owned join rows                                                         |
| Export knowledge | chat history                | `chat_threads` and `chat_messages` rows scoped by owner                                            |
| Export knowledge | retrieval metadata          | `retrieval_runs` and `retrieval_results` rows reachable through owned chat messages                |
| Export knowledge | citation history            | `answer_citations` snapshot columns reachable through owned chat messages                          |
| Export knowledge | redaction rule for vectors  | this spec, embeddings are excluded                                                                 |
| Purge source     | source ownership            | `knowledge_sources.user_id` matched to session user id                                             |
| Purge source     | purge eligibility           | `knowledge_sources.status = deleted` and `deleted_at is not null`                                  |
| Purge source     | rows to remove              | foreign key relationships from source to content, chunks, embeddings, jobs, and organization links |
| Purge source     | purge timestamp             | server clock inside the database transaction                                                       |
| Purge source     | citation survival           | `answer_citations` snapshot columns and nullable `chunk_id` foreign key                            |
| Purge UI         | confirmation value          | user typed exact source title                                                                      |
| Purge UI         | success state               | application use case result                                                                        |

**Key invariants**:

1. Export and purge derive the owner from the server session, never from client input.
2. Export never includes raw embedding vectors.
3. Export never includes purged source text, purged chunks, or purged embeddings.
4. A source can be purged only after archive has set `deleted_at` and status `deleted`.
5. Purge is idempotent from the user perspective. Repeating purge on the same source returns a clear already purged or not found result and does not recreate data.
6. Purge happens in one short database transaction with no model calls, fetches, or other external work inside the transaction.
7. Purge leaves the `knowledge_sources` tombstone row with `status = purged`, `purged_at`, `deleted_at`, title, type, and fingerprint for duplicate history and user feedback.
8. Retrieval continues to require `status = ready`, `deleted_at is null`, active content, and active chunks.
9. Citation rows are not deleted by source purge. Their snapshot fields remain, and `chunk_id` may be null.
10. RLS policies and server repository filters both enforce owner scoping.

**Security model**:

All export and purge paths are private to the signed in Supabase user. Server actions call `requireSessionUser`, then pass only that owner context to application use cases and repositories. Database queries must filter direct owner rows by `user_id`, and child rows must be reached through owned parent chains.

Supabase RLS remains the database backstop. Any new policy or changed policy must use `to authenticated` with owner predicates, and update policies must include both `using` and `with check` where row mutation is exposed. No `SECURITY DEFINER` helper should be added for this slice.

Private source text is intentionally present in export because export is a user controlled copy of their own data. Raw embeddings are excluded because they are provider derived implementation data and are not useful to the user.

**Configuration required**:

No new environment variables or external services are required.

**Critical test scenarios**:

- Happy path: an owner exports notes, documents, URLs, organization labels, chat history, and citations, verifies **AC-1** and **AC-2**.
- Purge path: an owner archives a source, purges it, and then source content, chunks, embeddings, jobs, and labels are removed while the source row is marked purged, verifies **AC-3** and **AC-4**.
- Citation path: a cited source is purged and old answer citations still display snapshot title, quote, and rank with null live chunk id, verifies **AC-5**.
- Retrieval path: a purged source cannot appear in lists, source detail, retry, edit, filters, or chat retrieval, verifies **AC-6**.
- Auth path: user B cannot export or purge user A data by guessing ids, verifies **AC-7**.
- UI path: purge requires explicit confirmation and shows useful error messages for invalid state or mismatch, verifies **AC-8**.
- Coverage path: focused domain, application, repository, route, and component tests cover redaction and lifecycle behavior, verifies **AC-9**.

## Build plan

1. Add export DTO types and an `exportOwnedKnowledge` use case that reads owner scoped sources, active content, organization labels, chat messages, retrieval metadata, and citation snapshots while excluding embeddings, satisfies **AC-1** and **AC-2**.
2. Add repository export reads that join only through owned parent rows and add focused tests for redaction and owner scoping, satisfies **AC-1**, **AC-2**, and **AC-7**.
3. Add `purgeArchivedSource` in the domain and application layer, enforcing `deleted` state, confirmation handled at the action boundary, and idempotent error semantics, satisfies **AC-3**, **AC-8**, and **AC-9**.
4. Add a short transaction repository method for purge that deletes child source data and marks the source tombstone `purged` with `purged_at`, relying on existing foreign keys for embeddings, retrieval results, and citation `chunk_id` nulling, satisfies **AC-4** and **AC-5**.
5. Add export and purge server actions or route handlers, then wire UI controls into source detail or settings surfaces with accessible confirmation, loading, success, and error states, satisfies **AC-1**, **AC-3**, **AC-6**, and **AC-8**.
6. Harden existing list, detail, edit, retry, dashboard, and chat retrieval paths so `purged` sources stay excluded everywhere, satisfies **AC-6**.
7. Add focused Vitest coverage for export, purge, citation survival, retrieval exclusion, ownership denial, and UI state rendering, then run `pnpm run quality:deadline`, satisfies **AC-9**.

## Consequences

**Positive**:

- Users get a real way to take their data out and remove private source text from active storage.
- The build reuses the existing source lifecycle model instead of adding a parallel deletion system.
- Account deletion becomes easier because source purge has one tested service boundary.

**Negative / tradeoffs**:

- Purge is destructive and must be treated carefully in UI and tests.
- Export JSON is useful for trust and portability, but it is not a full restore format yet.
- Keeping source tombstones means a tiny amount of metadata remains after purge.

**Neutral**:

- No background worker is introduced in this slice.
- No legal retention schedule is defined in this slice.
- Existing verification screenshots are ignored locally and not part of source control.

## Follow-up

- [ ] Design account deletion after source purge is implemented and tested.
- [ ] Decide whether export should later support a restore format or Markdown bundle.
- [ ] Decide whether purge events need a dedicated audit table before any team or compliance feature.

## Migration plan

**Strategy**: no schema migration expected for the first source purge slice
**Phases**:

1. Build export reads and source purge around existing `status`, `deleted_at`, `purged_at`, and foreign key behavior.
2. Add UI entry points and tests after the repository behavior is proven.
3. Revisit schema only if tests show a missing index or audit table is needed.

**Rollback**: revert the server actions and UI entry points. Since the first slice expects no schema change, rollback is a normal code revert. Any already purged data remains purged.

**Risks**: The main risk is deleting more than the owned source aggregate. Repository tests must prove the delete path is owner scoped and keeps citation snapshots readable.
