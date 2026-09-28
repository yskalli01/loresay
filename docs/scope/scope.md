# Scope: AI Personal Knowledge Base

This is the deadline scope for the AI Personal Knowledge Base MVP. The original broader plan is preserved in [scope-original-plan.md](scope-original-plan.md).

The product goal is one useful private loop: save knowledge, update it when needed, ask questions, and see grounded answers with citations. Anything that does not help that loop ship sooner is deferred.

**Build approach:** Tracer Bullet, keep one real path working before adding breadth.
**Workflow:** Deadline mode. Go straight to `/develop` when the build is known. Use `/architect` only for a real undecided technical choice. Verify with focused tests while iterating, then run the full quality gate before a final handoff.

## Deadline Workflow

Use this path for normal feature work:

1. Build the smallest useful version.
2. Run `pnpm run quality:deadline`.
3. Fix only issues that affect the current MVP path.
4. Run `pnpm run quality` before final delivery or merge.

Skip new specs unless a decision is genuinely unclear. Skip broad verification passes until the current slice is working.

## Skill Usage In Deadline Mode

- Use `/develop` by default for known MVP implementation work.
- Use `/architect` only when the team must choose between real technical options before building.
- Use `/test` after meaningful behavior changes, with focused tests first.
- Use `/check verify` for changed user visible flows that need browser proof, not for every small internal change.
- Use `/sync` after a feature milestone lands so project guidance stays current without slowing every edit.
- Preserve the full original workflow in `scope-original-plan.md`, but do not let it drive the deadline path by default.

## At A Glance

| #   | Feature                    | Phase      | Status      |
| --- | -------------------------- | ---------- | ----------- |
| 1   | Foundations                | Foundation | done        |
| 2   | Thin knowledge loop        | MVP        | done        |
| 3   | Note capture and editing   | MVP        | done        |
| 4   | Basic document ingestion   | MVP        | done        |
| 5   | Citation and answer polish | MVP        | done        |
| 6   | URL ingestion              | MVP        | done        |
| 7   | Source organization        | MVP        | done        |
| 8   | Source lifecycle           | MVP        | done        |
| 9   | Workspace navigation       | MVP        | done        |
| 10  | Privacy and data lifecycle | Post-MVP   | in-progress |

## Foundation

### 1. Foundations · done

Keep the existing stack, Clean Architecture boundaries, Supabase data model, UI foundation, and test setup. Do not expand foundation work unless it unblocks the MVP path.

**Done when:** the app builds, the main route works, and the current knowledge loop remains covered by focused tests.

- [x] Stack and architecture recorded in [0001](../specs/0001-stack-architecture.md)
- [x] Core data model recorded in [0002](../specs/0002-core-data-model.md)
- [x] UI foundation recorded in [0003](../specs/0003-design-system-ui-foundation.md)
- [x] Thin knowledge loop recorded in [0004](../specs/0004-thin-knowledge-loop.md)
- [x] Keep only deadline useful tooling in the active workflow

Code in `./`, `src/app`, `src/domain`, `src/application`, `src/infrastructure`, and `src/presentation`.

## MVP

### 2. Thin knowledge loop · done

A signed in user can save a text note, process it into chunks, ask a question, and receive a cited answer.

- [x] Auth and protected workspace
- [x] Text note save and inline processing
- [x] Live dashboard data and note form states
- [x] Default chat, retrieval, streamed answer, and citations
- [x] Focused verification and tests

Spec [0004](../specs/0004-thin-knowledge-loop.md) · code in `src/app`, `src/application/knowledge`, `src/infrastructure`, and `src/presentation`.

### 3. Note capture and editing · done

Let users correct and update their saved notes without rebuilding the product around a full source manager.

**Done when:** a signed in user can edit a saved text note, reprocess it, and get later answers from the updated content.

- [x] Add an edit action for existing note sources
- [x] Reuse the existing inline processing path for updated text
- [x] Show edit and reprocess states in the current dashboard
- [x] Add focused tests for ownership, validation, reprocessing, and updated retrieval

### 4. Basic document ingestion · done

Add the simplest useful document path. Prefer plain text and Markdown first if that ships faster than full PDF or Office parsing.

**Done when:** a signed in user can add one supported document type, process readable text through the same chunk and retrieval path, and ask questions with citations.

- [x] Choose the fastest supported input type for the deadline
- [x] Store document metadata on the existing source records
- [x] Extract text and reuse the existing chunk and embedding path
- [x] Show success and failure in the current dashboard
- [x] Add focused tests for supported file type, ownership, failure, and retrieval

### 5. Citation and answer polish · done

Improve the current answer display only where it directly increases trust in the MVP.

**Done when:** citations are easy to inspect, unsupported answers stay honest, and the UI makes the source of an answer clear.

- [x] Make citation labels and source titles clearer
- [x] Keep unsupported answers citation free
- [x] Add a compact source excerpt where it helps trust
- [x] Add focused tests for supported and unsupported answers

### 6. URL ingestion · done

Add a focused web-page ingestion path that feeds the same source, content, chunk, embedding, and retrieval loop as notes and documents.

**Done when:** a signed in user can submit an HTTP/HTTPS URL, fetch readable page text, process it, and inspect the saved source.

- [x] Validate URLs and block local/private hosts before fetching
- [x] Fetch text or HTML content and extract readable text
- [x] Store URL metadata and process through the existing chunk and embedding path
- [x] Add focused tests for extraction and blocked local URLs

### 7. Source organization · done

Add the smallest useful source manager around the existing collections and tags tables.

**Done when:** a signed in user can create collections and tags, filter sources, open source detail pages, and attach organization labels to owned sources.

- [x] Add dashboard filters for query, type, status, collection, and tag
- [x] Add collection and tag creation forms
- [x] Add source detail pages with metadata and active extracted content
- [x] Add owned source-to-collection and source-to-tag linking actions

### 8. Source lifecycle · done

Make saved sources safer to manage and make retrieval more precise before adding larger ingestion features.

**Done when:** a signed in user can archive a source, retry failed processing, see clearer URL ingestion errors, and scope chat retrieval by collection or tag.

- [x] Archive sources with a soft delete that removes them from retrieval
- [x] Retry failed sources from active extracted text
- [x] Show clearer URL ingestion errors for blocked, duplicate, oversized, unsupported, and fetch failed URLs
- [x] Let chat retrieval scope to a collection or tag
- [x] Add focused tests for lifecycle actions, retry, and filtered retrieval

### 9. Workspace navigation · done

Split the crowded dashboard into focused workspace pages so each main feature has its own sidebar destination.

**Done when:** a signed in user can use the sidebar to move between an overview, notes, ingestion, chat, and sources without losing the existing knowledge loop controls.

- [x] Keep `/` as an overview with metrics, quick links, recent sources, and ingestion status
- [x] Add focused pages for notes, ingestion, chat with AI, and sources
- [x] Keep source detail pages under the Sources navigation item
- [x] Move capture, ingestion, organization, and chat controls out of the front page
- [x] Add focused route render tests for the new navigation structure

## Post MVP

### 10. Privacy and data lifecycle · in-progress

Let users take their data out and permanently purge archived sources without breaking citation history.

**Done when:** a signed in user can export owned knowledge, purge an archived source, and trust that purged source text and vectors are no longer retrievable while old citation snapshots remain readable.

Spec [0005](../specs/0005-privacy-data-lifecycle.md) · code in `src/app`, `src/application/knowledge`, `src/infrastructure/db`, and `src/presentation`.

- [x] Design it (spec): [0005](../specs/0005-privacy-data-lifecycle.md)
- [ ] Build it: /develop privacy and data lifecycle
  - [ ] Export owned knowledge without raw embeddings, covers AC-1 and AC-2
  - [ ] Purge archived sources through the repository lifecycle boundary, covers AC-3 through AC-5
  - [ ] Exclude purged sources from all source, retry, edit, filter, and chat paths, covers AC-6 and AC-7
  - [ ] Add accessible export and purge UI states, covers AC-8
- [ ] Test it: /test privacy and data lifecycle
- [ ] Verify it: /check verify privacy and data lifecycle

## Deferred

These are intentionally outside the deadline path. Bring them back after the MVP is usable.

- Connectors framework
- Product analytics and error visibility
- Advanced grounded answer diagnostics and feedback capture
- Team workspaces
- Billing and plans
- Browser extension
- Mobile capture
- Knowledge graph view
- Public sharing
- Internationalization

## Rules For Deadline Work

- Prefer one working path over broad platform work.
- Reuse the existing source, content, chunk, embedding, retrieval, and citation model.
- Keep owner scoping and private data safety as non negotiable.
- Add a spec only when implementation would otherwise require guessing.
- Use `pnpm run quality:deadline` while iterating.
- Use `pnpm run quality` before final delivery or merge.
