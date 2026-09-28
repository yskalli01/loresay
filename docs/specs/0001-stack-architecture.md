# 0001. Stack And Architecture

**Date**: 2026-09-08
**Status**: Accepted

## Summary

Use a single TypeScript full stack web app for the first build. Store app data, auth data, files, and vector embeddings in managed Supabase services, then call OpenAI through a small server side RAG pipeline. This keeps the first knowledge loop real, private, and easy to operate while leaving room to extract heavier ingestion workers later.

## Context

This is a greenfield AI Personal Knowledge Base. The first product goal is a solo user MVP that can ingest private knowledge, organize it, and answer questions with source citations through retrieval augmented generation, meaning the model answers from retrieved stored content rather than memory alone.

The system needs a real end to end path early: sign in, save one source, extract text, chunk it, embed it, retrieve it, ask a question, and show cited output. The biggest early risks are data lineage, private data handling, answer grounding, and too much infrastructure before the product loop proves itself.

The project scope already chose a Tracer Bullet build approach, so the stack should support one thin vertical slice through UI, server logic, database, storage, vector search, and AI calls. The team has not chosen a stack yet. The repo currently has only scope and context docs, no app scaffold.

## Options considered

### Option 1: Next.js plus Supabase plus OpenAI

A TypeScript web app uses Next.js App Router for UI and server code, Supabase for Postgres, auth, storage, and pgvector, Drizzle for typed schema and queries, Vercel AI SDK for streaming chat, OpenAI for embeddings and generation, and Vercel for hosting.

**Pros**:

- One language across UI and server code.
- Managed auth, database, storage, and vector search reduce early operating load.
- Postgres keeps source records, chunks, citations, and user ownership relational and queryable.
- The first RAG path can ship without a separate vector database or search service.

**Cons**:

- Supabase becomes an important platform dependency.
- Long document processing may outgrow request lifecycle limits and need a worker later.
- Row level security and server side session handling must be designed carefully for private data.

### Option 2: Next.js plus managed Postgres plus separate auth, storage, and vector database

A TypeScript web app uses separate best of breed services for auth, relational data, object storage, vector search, and hosting.

**Pros**:

- Each layer can be chosen for depth and swapped independently.
- A dedicated vector database may offer more retrieval tuning at larger scale.
- Auth and storage vendors can be optimized separately.

**Cons**:

- More vendors, secrets, failure modes, and local setup before the first slice proves value.
- Identity, file ownership, source deletion, and citation lineage cross more system boundaries.
- The team must build more glue code and operational runbooks on day one.

### Option 3: Python API plus React frontend plus managed data services

A separate Python backend handles ingestion and RAG, while a React frontend handles the product UI. Managed Postgres, storage, and auth still carry the data platform.

**Pros**:

- Python has mature document parsing and AI data tooling.
- Backend workers and batch ingestion are natural once ingestion gets complex.
- The API boundary can stay clear for future clients.

**Cons**:

- Two runtimes and two deployable units increase setup and debugging for a solo MVP.
- Auth and session handling need more integration work across frontend and backend.
- The first UI to RAG loop takes longer to stand up.

### Option 4: Low code backend or hosted knowledge platform

Use a hosted application backend or knowledge platform to assemble ingestion and chat faster with less custom code.

**Pros**:

- Fastest path to a demo.
- Many operational details are outsourced.
- Useful if the goal is only validating interest.

**Cons**:

- Harder to own source lineage, deletion behavior, retrieval logic, and answer quality.
- Product differentiation sits behind platform constraints.
- Future migration could be painful if private data, citations, or integrations become core.

## Decision

**Chosen option**: Option 1: Next.js plus Supabase plus OpenAI

Build a single TypeScript full stack app with Next.js App Router, Supabase Postgres with pgvector, Supabase Auth, Supabase Storage, Drizzle, Vercel AI SDK, OpenAI embeddings and generation, and Vercel hosting.

## Rationale

This product needs trusted private knowledge and cited answers more than it needs distributed infrastructure. A relational database is the right center because sources, chunks, embeddings, collections, chats, citations, and ownership all have durable relationships and deletion rules. Keeping vectors in Postgres through pgvector is the simplest credible first choice because it keeps retrieval data beside source lineage.

Next.js gives one deployable app for the early UI and server actions, which fits the solo MVP and the Tracer Bullet scope. Supabase removes a large amount of auth, storage, and database operations while still leaving the data model explicit. OpenAI and the Vercel AI SDK keep the chat path direct and streaming without inventing a custom model abstraction too early.

The runner up is the Python API plus React frontend. It will be attractive when document ingestion becomes heavier, but it adds a second runtime before the first product loop has proven itself. The spec therefore leaves room for later background workers, while keeping the initial architecture a well structured monolith.

## Proposed stack

| Layer                     | Choice                                                                                         | Reason                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Product shape             | Single full stack web app                                                                      | One deployable unit is easiest to build, debug, and operate for a solo MVP.                                                          |
| Architecture pattern      | Clean Architecture inside a modular monolith                                                   | The repo already records Clean Architecture rules, and one app should still keep domain logic away from framework and provider code. |
| Language and runtime      | TypeScript on Node.js 24 LTS                                                                   | TypeScript covers UI and server code with strict types, and Node.js 24 is the active LTS line as of September 2026.                  |
| Package manager           | pnpm                                                                                           | It is fast, common in modern TypeScript apps, and works well if the project later grows into workspaces.                             |
| Framework                 | Next.js App Router                                                                             | It supports React UI, server components, server functions, routing, and API handlers in one framework.                               |
| Styling and components    | Tailwind CSS plus shadcn/ui plus lucide-react                                                  | This gives accessible, editable component source and icons without locking the app into a heavy component library.                   |
| Primary database          | Supabase Postgres                                                                              | Relational data, transactions, JSON fields, constraints, and managed operations fit the product model.                               |
| Vector storage and search | Supabase Postgres with pgvector                                                                | Embeddings stay near source records and deletion rules, which is the safest first RAG design.                                        |
| ORM and migrations        | Drizzle ORM and Drizzle Kit                                                                    | It keeps TypeScript schema definitions close to SQL and avoids hiding complex queries behind opaque abstractions.                    |
| Auth                      | Supabase Auth with cookie based server side rendering support                                  | Auth is proven service work, and Supabase integrates sessions with Next.js server code.                                              |
| File storage              | Supabase Storage                                                                               | User documents belong in object storage, with database rows holding metadata and retrieval state.                                    |
| AI model access           | OpenAI API through Vercel AI SDK                                                               | OpenAI provides the embeddings and generation path, while the SDK gives streaming UI and provider isolation.                         |
| Embedding model           | `text-embedding-3-small`                                                                       | It is low cost and good enough for the first personal knowledge retrieval loop.                                                      |
| Background work           | Start with database backed ingestion jobs inside the app, then extract to a worker when needed | The first slice should not add a queue service before document volume proves the need.                                               |
| API shape                 | Server actions and route handlers inside Next.js                                               | They keep the first app compact while still exposing explicit server side boundaries.                                                |
| Hosting                   | Vercel for the web app, Supabase for data services                                             | This pairing is common for Next.js and removes server operations from the first release.                                             |
| Observability             | Structured logs plus hosted error tracking                                                     | Private content should stay out of telemetry, but failures in ingestion, retrieval, and chat need visibility from day one.           |
| Testing                   | Vitest for unit tests, Playwright for browser flows                                            | Domain and application logic can run fast in unit tests, and the RAG loop needs real browser verification.                           |

## Consequences

**Positive**:

- The first slice can prove the whole knowledge loop without separate services for auth, storage, vector search, and chat streaming.
- Source lineage and deletion behavior can live in one relational model.
- The app can stay small while still using production capable building blocks.

**Negative / tradeoffs**:

- The app depends heavily on Supabase availability, limits, and auth behavior.
- Long or high volume ingestion may need a dedicated worker, queue, or Python service later.
- Mixing UI and server code in one framework requires discipline so domain logic does not leak into framework files.
- Vercel request limits can shape how much ingestion happens synchronously.

**Neutral**:

- The first scaffold should install only the runnable skeleton and the libraries required for the thin knowledge loop.
- Later specs still need to decide the core data model, RAG retrieval policy, privacy controls, and connector framework.

## Follow-up

- [ ] Run `/develop stack and architecture` to scaffold the chosen stack.
- [ ] Run `/audit` again after the scaffold exists, so commands and stack fields in `AGENTS.md` can be filled from real files.
- [ ] Design `core data model` before adding document, URL, or connector ingestion.
- [ ] Consider installing project skills for Next.js, Supabase, Drizzle, Vercel AI SDK, Tailwind CSS, and Playwright once the scaffold exists.

## References

**Project sources**:

- `AGENTS.md`, Clean Architecture and strict type guidance.
- `docs/scope/scope.md`, Tracer Bullet approach and Beta workflow.

**Practices and standards**:

- Monolith first for small teams.
- Relational database as the default durable system of record.
- Proven auth service instead of custom auth.
- Object storage for user files.
- Database backed jobs before a dedicated broker for early volume.

**Links**:

- Next.js App Router: https://nextjs.org/docs/app
- Supabase AI and vectors: https://supabase.com/docs/guides/ai
- Supabase vector columns: https://supabase.com/docs/guides/ai/vector-columns
- Supabase server side auth: https://supabase.com/docs/guides/auth/server-side
- Supabase server package choice: https://supabase.com/docs/guides/auth/choosing-a-server-package
- Drizzle ORM overview: https://orm.drizzle.team/docs/overview
- Vercel AI SDK: https://vercel.com/ai-sdk
- OpenAI `text-embedding-3-small`: https://developers.openai.com/api/docs/models/text-embedding-3-small
- Next.js on Vercel: https://vercel.com/docs/frameworks/full-stack/nextjs
- Node.js releases: https://nodejs.org/en/about/previous-releases
- shadcn/ui official docs: https://ui.shadcn.com/docs/official
