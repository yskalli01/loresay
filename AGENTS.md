# AI Personal Knowledge Base

## Stack

1. **Language / Runtime**: TypeScript on Node.js 24 LTS
2. **Framework**: Next.js App Router
3. **Key dependencies**: Supabase, Drizzle ORM, OpenAI, Vercel AI SDK, Tailwind CSS, lucide-react, Vitest, Playwright
4. **Package manager**: pnpm

## Build approach

Tracer Bullet (prove one real path through every layer first, then add breadth).

## Deadline skill workflow

1. Default to `/develop` for known MVP implementation work.
2. Use `/architect` only when a real technical decision is still open.
3. Use `/test` for targeted behavior coverage after meaningful code changes.
4. Use `/check verify` only for user visible flows that need browser proof.
5. Use `/sync` at feature milestones, not after every small edit.
6. Keep specs and broad reviews out of the critical path unless they prevent guessing or reduce real risk.

## Commands

```bash
# Install
pnpm install

# Dev server
pnpm run dev

# Build
pnpm run build

# Test
pnpm run test
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

1. Use Clean Architecture unless a later spec records a different choice.
2. Keep `domain` for entities and value objects, `application` for use cases, `infrastructure` for databases, APIs, and framework code, and `presentation` for UI or controllers.
3. Keep the dependency rule clear: outer layers may depend on inner layers, inner layers should not depend on outer layers.
4. Keep domain code free of framework, database, HTTP client, and AI provider imports.
5. Put business rules and invariants in domain entities or domain services.
6. Use DTOs or plain objects across boundaries, so domain entities do not leak into presentation code.
7. Prefer strict types for new typed code, with no broad `any` unless the reason is documented.
8. Organize feature work by feature folder where it helps the slice stay readable.
9. Validate environment variables at startup and use one consistent error handling pattern.
10. Treat accessibility as a baseline for UI work, with keyboard use, focus states, labels, empty states, and error states.
11. Before Supabase work, read and follow the installed project skills at `.agents/skills/supabase/` and `.agents/skills/supabase-postgres-best-practices/`.
12. Before Next.js, Vercel, or Vercel AI SDK work, use the installed Vercel plugin guidance, then read the relevant Next.js guide in `node_modules/next/dist/docs/`.
13. Use `AI_PROVIDER=stub` for local verification without OpenAI credits; use `AI_PROVIDER=openai` with `OPENAI_API_KEY` for provider checks and production.

## Tooling

1. Lint with ESLint via `pnpm run lint`.
2. Type check with TypeScript via `pnpm run typecheck`.
3. Test the focused MVP path with Vitest via `pnpm run test:core`.
4. Test the full suite with Vitest via `pnpm run test`.
5. Run browser flows with Playwright via `pnpm run test:e2e` only when an end to end surface needs proof.
6. Use `pnpm run quality:deadline` while iterating and `pnpm run quality` before final delivery or merge.

## Git

1. integration: off

## Agent skills

- Declined: Agent Skill and MCP discovery for Next.js, Supabase, Drizzle ORM, OpenAI, Vercel AI SDK, Tailwind CSS, Vitest, and Playwright.

## Context files

- Design system: build all UI to `design.md` (art direction and the maximalist product bar); token values live in CSS.

Nested `AGENTS.md` files will be listed here when an area needs its own context.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
