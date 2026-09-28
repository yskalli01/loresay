# Scope: AI Personal Knowledge Base

A full stack application for people who want one trusted place to collect documents, URLs, notes, and connected knowledge, then ask an AI chatbot for answers grounded in what they saved. The first pass assumes a solo user MVP with private personal data, source citations, and a real retrieval augmented generation loop.

**Build approach:** Tracer Bullet (prove one real path through every layer first, then add breadth).
**Workflow:** Beta (`/check verify`, then `/test`). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| #   | Feature                                | Phase      | Status      |
| --- | -------------------------------------- | ---------- | ----------- |
| 1   | Stack and architecture                 | Foundation | in-progress |
| 2   | Coding standards and tooling           | Foundation | in-progress |
| 3   | Core data model                        | Foundation | in-progress |
| 4   | Design system and UI foundation        | Foundation | in-progress |
| 5   | Thin knowledge loop                    | Slice 1    | done        |
| 6   | Document ingestion                     | Slice 2    | planned     |
| 7   | URL ingestion                          | Slice 3    | planned     |
| 8   | Note capture and editing               | Slice 4    | planned     |
| 9   | Knowledge organization                 | Slice 5    | planned     |
| 10  | Grounded answer quality                | Slice 6    | planned     |
| 11  | Connectors framework                   | Slice 7    | planned     |
| 12  | Privacy controls and data lifecycle    | Slice 8    | planned     |
| 13  | Product analytics and error visibility | Slice 9    | planned     |

## Foundations

### 1. Stack and architecture · in-progress

Decide the application shape and scaffold a runnable project so every later slice builds on real structure.
**Done when:** the stack is recorded in a spec, the empty scaffold boots locally, and the build command passes.

- [x] Decide the stack (spec): `/architect stack and architecture`
- [x] Scaffold from the decision: `/develop stack and architecture`
- [x] Verify it: `/check verify stack and architecture`
- [x] Test it: `/test stack and architecture`
      Spec [0001](../specs/0001-stack-architecture.md) · code in `./`

### 2. Coding standards and tooling · in-progress

Capture conventions from the real scaffold, then install lint, format, test, and continuous integration basics.
**Done when:** root `AGENTS.md` reflects the actual project, and the standard quality commands run clean.

- [x] Capture conventions and tooling choices: `/audit`
- [x] Install the tooling: `/develop tooling`
- [x] Check it runs clean: `/test tooling`
      code in `./`

### 3. Core data model · in-progress

Model users, knowledge items, source records, extracted content, chunks, embeddings, collections, chat threads, and answer citations.
**Done when:** the model can store source provenance, chunk lineage, retrieval metadata, and chat history without losing where any answer came from.

- [x] Design it (spec): `/architect core data model`
- [x] Build it: `/develop core data model`
  - [x] Domain enums, limits, DTO shapes, and source type rules, covers AC-1, AC-3, AC-5, AC-6
  - [x] Source, content, chunk, embedding, and ingestion schema plus use cases, covers AC-1, AC-2, AC-3, AC-6
  - [x] Collections, tags, and same user organization links, covers AC-4, AC-6
  - [x] Chat, retrieval, result, and purge safe citation records, covers AC-5, AC-6, AC-7
  - [x] Owner scoped policies, invariants, and data model tests, covers AC-1 through AC-7
  - [x] Apply the generated migration to Supabase and confirm the live schema
- [x] Verify it: `/check verify core data model`
- [x] Test it: `/test core data model`
      Spec [0002](../specs/0002-core-data-model.md) · code in `src/domain/knowledge`, `src/application/knowledge`, `src/infrastructure/db`

### 4. Design system and UI foundation · in-progress

Create the base app layout, navigation, forms, tables, source cards, chat surfaces, loading states, and accessible interaction patterns.
**Done when:** a user can move through the app shell clearly, and core components handle focus, keyboard use, empty states, and errors.

- [x] Design it (spec): `/architect design system and UI foundation`
- [x] Build it: `/develop design system and UI foundation`
  - [x] App shell, route config, and responsive navigation, covers AC-1, AC-5
  - [x] Knowledge dashboard with placeholder view models, covers AC-2, AC-4
  - [x] Theme tokens and local UI primitives, covers AC-3, AC-4, AC-5
  - [x] Component states and accessibility tests, covers AC-5, AC-6
- [x] Verify it: `/check verify design system and UI foundation`
- [x] Test it: `/test design system and UI foundation`
      Spec [0003](../specs/0003-design-system-ui-foundation.md) · code in `src/app`, `src/presentation`

## Slice 1: Thin Knowledge Loop

### 5. Thin knowledge loop · done

Build the smallest real loop: sign in, create one text knowledge item, chunk it, retrieve from it, ask the chatbot a question, and see cited output.
**Done when:** a real user can save one piece of text and receive a grounded answer with at least one citation back to the saved content.

- [x] Design it (spec): `/architect thin knowledge loop`
- [x] Build it: `/develop thin knowledge loop`
  - [x] Auth and protected workspace, covers AC-1, AC-9
  - [x] Text note save and inline processing, covers AC-2, AC-3, AC-4
  - [x] Live dashboard data and note form states, covers AC-2, AC-3, AC-4, AC-9
  - [x] Default chat, retrieval, streamed answer, and citations, covers AC-5, AC-6, AC-7, AC-8, AC-9
  - [x] Verification and tests, covers AC-1 through AC-9
- [x] Verify it: `/check verify thin knowledge loop`
- [x] Test it: `/test thin knowledge loop`
      Spec [0004](../specs/0004-thin-knowledge-loop.md) · code in `src/app`, `src/application/knowledge`, `src/infrastructure`, `src/presentation`

## Slice 2: Document Ingestion

### 6. Document ingestion · needs a decision

Let the user upload common documents, extract readable text, preserve source metadata, and send the content through the same retrieval path.
**Done when:** a user can upload a document, inspect ingestion status, ask about its contents, and see citations that point back to the source.

- [ ] Design it (spec): `/architect document ingestion`

## Slice 3: URL Ingestion

### 7. URL ingestion · needs a decision

Let the user save a URL, fetch readable page content, record source details, and include it in chat retrieval.
**Done when:** a user can add a URL, see whether extraction succeeded, ask about the page, and get cited answers from that page.

- [ ] Design it (spec): `/architect URL ingestion`

## Slice 4: Note Capture And Editing

### 8. Note capture and editing

Give users a fast way to write, edit, and reprocess their own notes inside the knowledge base.
**Done when:** a user can create and edit notes, and updated notes are reflected in later chatbot answers.

- [ ] Build it: `/develop note capture and editing`

## Slice 5: Knowledge Organization

### 9. Knowledge organization · needs a decision

Add collections, tags, search, filters, and source detail pages so the user can browse and curate stored knowledge without relying only on chat.
**Done when:** a user can group sources, find a known item, inspect its extracted content, and control whether it participates in retrieval.

- [ ] Design it (spec): `/architect knowledge organization`

## Slice 6: Grounded Answer Quality

### 10. Grounded answer quality · needs a decision · GA

Improve answer trust with clearer citations, retrieval diagnostics, refusal behavior when sources do not support an answer, and feedback capture.
**Done when:** answers show usable source grounding, unsupported questions are handled honestly, and the user can mark answer quality for later review.

- [ ] Design it (spec): `/architect grounded answer quality`

## Slice 7: Connectors Framework

### 11. Connectors framework · needs a decision

Prepare a generic integration pattern for external sources, then prove it with one simple read only connector.
**Done when:** one connected source can import knowledge through the same source, chunk, retrieval, and citation path as manual ingestion.

- [ ] Design it (spec): `/architect connectors framework`

## Slice 8: Privacy Controls And Data Lifecycle

### 12. Privacy controls and data lifecycle · needs a decision · GA

Give users control over private knowledge, including source deletion, reprocessing, export, and clear account level data handling.
**Done when:** a user can delete or export their knowledge, disabled sources stop appearing in retrieval, and deleted content is removed from search and chat grounding.

- [ ] Design it (spec): `/architect privacy controls and data lifecycle`

## Slice 9: Product Analytics And Error Visibility

### 13. Product analytics and error visibility · needs a decision

Track product health, ingestion failures, retrieval failures, answer feedback, and the core activation path without exposing private source content.
**Done when:** the app records useful operational and product events, and private knowledge text is not captured in analytics by default.

- [ ] Design it (spec): `/architect product analytics and error visibility`

## Deferred

Out of scope for the current build pass, kept so the plan stays honest.

- **Team workspaces**: shared collections, members, roles, and permissions · needs a decision · GA
- **Billing and plans**: subscription limits for storage, sources, and chat usage · needs a decision · GA
- **Advanced connector catalog**: many source integrations beyond the first connector · needs a decision
- **Browser extension**: save pages and snippets directly while browsing · needs a decision
- **Mobile capture**: quick save, voice note, and share sheet flows · needs a decision
- **Knowledge graph view**: visual relationships across entities, sources, topics, and claims · needs a decision
- **Public sharing**: share selected notes or answer threads outside the private workspace · needs a decision · GA
- **Internationalization**: additional languages and locale specific formatting · needs a decision

## Legend

**The decision box.** Every feature that needs a decision carries exactly one box whose label ends with `(spec)`. Its wording varies, so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State                        | Set by                       | The feature shows                                                                                                |
| ---------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `planned` · needs a decision | `/scope`                     | one box: `Design it (spec): /architect <feature>`                                                                |
| `in-progress` (designed)     | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` plus 2 to 5 milestones; the tier's closing boxes |
| `in-progress` (building)     | `/develop`                   | milestone sub boxes tick one by one; code pointer filled                                                         |
| `in-progress` (verified)     | `/check verify`              | `Build it` plus milestones ticked; `Verify it` ticked                                                            |
| `done`                       | you, when you decide it is   | boxes you ran ticked, skipped ones marked skipped; `/sync` captures conventions                                  |

- **Next step** = the first unticked box, always a command or a tracked milestone.
- **needs a decision** = run `/architect` first; otherwise straight to `/develop`, or `/audit` for standards and tooling.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` and `dropped`.
- **Approach tag** beside a heading overrides the project default for that feature; no tag means it inherits.
- **Workflow tier tag** beside a heading sets that one feature's rigor above or below the project default; no tag means it inherits. **Prototype** = nothing after `/develop`; **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds `/check review` then `/document`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link is added by `/architect`, the code path by `/develop`.
