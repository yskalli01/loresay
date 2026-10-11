# Fix chat generic response

## Goal
Investigate and fix the chat path so users do not get a generic unsupported answer when saved knowledge should be available. Use the existing Gemini key for both retrieval embeddings and answer generation because no OpenAI key is available.

## Skills and guidance read
- AGENTS.md
- /develop skill at C:\Users\yskal\.agents\skills\develop\SKILL.md
- Project Supabase skill at .agents/skills/supabase/SKILL.md
- Project Postgres best practices skill at .agents/skills/supabase-postgres-best-practices/SKILL.md
- Next.js route handler guide at node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
- Prior prompt at prompts/chat-page-chatbot-gemini.md
- Google Gemini embeddings docs at https://ai.google.dev/gemini-api/docs/embeddings

## Code inspected
- src/app/api/chat/route.ts
- src/presentation/app/chat-panel.tsx
- src/application/knowledge/thin-loop.ts
- src/infrastructure/ai/thin-loop-gateways.ts
- src/infrastructure/ai/stub-gateways.ts
- src/infrastructure/openai/thin-loop-gateways.ts
- src/infrastructure/gemini/thin-loop-gateways.ts
- src/infrastructure/db/knowledge-repository.ts
- src/env.ts
- src/env.test.ts
- src/application/knowledge/thin-loop.test.ts
- src/infrastructure/ai/thin-loop-gateways.test.ts
- src/app/api/chat/route.test.ts
- .env.local
- .env.example
- README.md

## Findings
- The text in the screenshot comes from answerQuestion, before the answer provider is called.
- That branch runs when retrieval finds no chunks, or the top retrieved score is at or below 0.2.
- The local .env.local sets ANSWER_PROVIDER=gemini and has a Gemini key, but no OpenAI key.
- With the old setup, answer generation used Gemini while embeddings and retrieval fell back to the local stub provider.
- The stub provider is only for deterministic local checks, so Gemini often received no retrieved context.
- Gemini embedding models support configurable output dimensions, including 1536, which matches the existing database vector column.

## Decisions and assumptions
- Preserve grounded answers. Do not let the model answer from general knowledge when no saved chunks are retrieved.
- Add Gemini embeddings rather than requiring OpenAI.
- Keep the existing 1536 dimension database shape.
- Use Gemini embedding output dimensionality 1536.
- Default Gemini embedding model to gemini-embedding-2.
- Existing saved sources may need retry or edit and save so their embeddings are regenerated with Gemini.
- Keep code changes small and avoid database schema or migration changes.

## Files expected to touch
- src/env.ts
- src/env.test.ts
- src/infrastructure/gemini/thin-loop-gateways.ts
- src/infrastructure/ai/thin-loop-gateways.ts
- src/infrastructure/ai/thin-loop-gateways.test.ts
- src/application/knowledge/thin-loop.ts
- src/application/knowledge/thin-loop.test.ts
- .env.example
- README.md

## Requirements
- Keep /api/chat authentication and owner derivation unchanged.
- Keep retrieval restricted to ready, active, not deleted, owned chunks.
- Keep citation creation only for supported answers.
- Keep streaming NDJSON behavior unchanged.
- Add Gemini embedding support for AI_PROVIDER=gemini.
- Make AI_PROVIDER default to gemini when Gemini is configured and OpenAI is not.
- Make unsupported responses clearer when there is no usable retrieved support.
- Avoid logging private source text or user questions.
- Keep AI_PROVIDER=stub usable for local verification without external API keys.
- Keep OpenAI paths working for users who have OpenAI keys.

## Security considerations
- Do not expose server only keys to client code.
- Do not add client controlled owner fields.
- Do not weaken RLS assumptions or owner scoped repository calls.
- Do not send retrieved private chunks anywhere except the configured server side answer provider.
- Do not add broad error details to the browser.

## Acceptance criteria
- AI_PROVIDER=gemini selects Gemini embeddings.
- ANSWER_PROVIDER=gemini selects Gemini answers.
- Gemini embeddings return 1536 dimension vectors.
- Unsupported chat responses are clearer than the current generic message.
- Supported retrieved chunks still stream through the configured answer provider and still produce citations.
- Stub and OpenAI provider paths still pass tests.
- Existing chat route tests still pass.

## Checks to run
1. pnpm run typecheck
2. pnpm run lint
3. pnpm run test:core
4. pnpm run test
5. pnpm run quality:deadline

## Manual test steps
1. Set AI_PROVIDER=gemini, ANSWER_PROVIDER=gemini, GEMINI_API_KEY, GEMINI_MODEL, and GEMINI_EMBEDDING_MODEL.
2. Restart the dev server.
3. Reprocess one saved note so it gets Gemini embeddings.
4. Open http://localhost:3000/chat while signed in.
5. Ask hello and confirm the assistant gives a helpful non knowledge prompt.
6. Ask a question about the reprocessed saved note and confirm a grounded answer appears.
7. Confirm citations appear on supported answers.
