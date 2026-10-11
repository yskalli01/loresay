# Chat page chatbot and Gemini answer provider

## Goal

Turn the chat page from a static answer display into a real chatbot style conversation, keep grounded citations, and support scoping chat by collection. Add Gemini answer generation support for `gemini-3.8-flash` so the app can use the API key when provided.

## Skills and guidance read

- `AGENTS.md`
- `/develop` skill at `C:\Users\yskal\.agents\skills\develop\SKILL.md`
- Next.js page guide at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
- Existing scope in `docs/scope/scope.md`
- Existing chat spec in `docs/specs/0004-thin-knowledge-loop.md`
- Google Gemini API docs for `generateContent`, `generateContentStream`, and embeddings

## Code inspected

- `src/app/chat/page.tsx`
- `src/presentation/app/chat-panel.tsx`
- `src/app/api/chat/route.ts`
- `src/application/knowledge/thin-loop.ts`
- `src/infrastructure/ai/thin-loop-gateways.ts`
- `src/infrastructure/ai/stub-gateways.ts`
- `src/infrastructure/openai/thin-loop-gateways.ts`
- `src/env.ts`
- `src/app/api/chat/route.test.ts`
- `src/presentation/app/chat-panel.test.tsx`
- `src/infrastructure/ai/thin-loop-gateways.test.ts`
- `.env.example`
- `package.json`

## Decisions and assumptions

- Gemini is used for answer generation, with default model `gemini-3.8-flash`.
- Existing embeddings stay on the current provider path. This avoids mixing embedding vector spaces and preserves existing retrieval behavior.
- Add a separate answer provider setting rather than replacing embedding provider behavior.
- Use Gemini REST streaming through `fetch`, not a new SDK package, to avoid dependency churn.
- Keep `AI_PROVIDER=stub` working for local verification without API keys.
- Add `ANSWER_PROVIDER=gemini`, `GEMINI_API_KEY`, and optional `GEMINI_MODEL=gemini-3.8-flash` to env handling.
- If `ANSWER_PROVIDER` is unset, keep existing behavior so current deployments do not break.
- If you later want Gemini embeddings too, that should be a separate migration and reprocessing feature because existing vectors were created in another embedding space.

## Files expected to touch

- `src/presentation/app/chat-panel.tsx`
- `src/presentation/app/chat-panel.test.tsx`
- `src/app/api/chat/route.ts`
- `src/app/api/chat/route.test.ts`
- `src/infrastructure/ai/thin-loop-gateways.ts`
- `src/infrastructure/ai/thin-loop-gateways.test.ts`
- `src/infrastructure/gemini/thin-loop-gateways.ts`
- `src/env.ts`
- `.env.example`
- Maybe `src/app/page.test.tsx` if static chat copy expectations need updating

## Requirements

- Remove the hard coded initial user question and assistant answer from the chat page.
- Show an empty conversational state before the first user message.
- On submit, append the user message to the visible thread immediately.
- Stream the assistant reply into a new assistant bubble.
- Keep citations displayed on the assistant message that produced them.
- Keep errors visible inline without losing the user typed conversation.
- Keep the existing collection control.
- Send selected `collectionId` to `/api/chat` as it already supports.
- Prevent double submits while a response is pending.
- Reset the input after successful submit.
- Preserve keyboard and screen reader basics: form label, visible focus, status text while pending, and accessible error output.
- Add Gemini answer gateway that formats retrieved chunks as grounded context and streams text deltas.
- Do not log private question text or retrieved chunk text.
- Keep existing OpenAI and stub paths working.

## Security considerations

- Server route must keep deriving owner from Supabase session.
- Client must not send ownership fields.
- Gemini API key stays server only through `GEMINI_API_KEY`.
- Retrieved private chunks are sent only from server side to the configured answer provider.
- Existing RLS and owner scoped repository calls remain unchanged.

## Acceptance criteria

- Chat page behaves like a chatbot with multiple visible user and assistant messages.
- No static example discussion appears on first load.
- The first empty state invites the user to ask a question without implying sample content exists.
- Collection filters continue to scope retrieval.
- `/api/chat` still streams NDJSON delta and done events.
- `ANSWER_PROVIDER=gemini` uses `GEMINI_API_KEY` and `GEMINI_MODEL` or the default `gemini-3.8-flash`.
- Existing `stub` and `openai` paths still pass tests.
- Local checks pass without a Gemini key when using `AI_PROVIDER=stub`.

## Checks to run

1. `pnpm run typecheck`
2. `pnpm run lint`
3. `pnpm run test:core`
4. `pnpm run test`
5. `pnpm run quality:deadline`
6. `Invoke-WebRequest http://localhost:3000/chat` to confirm the route responds

## Manual test steps

1. Open `http://localhost:3000/chat` while signed in.
2. Confirm there is no prefilled sample discussion.
3. Ask a question with no filter and watch the assistant stream a reply.
4. Select a collection and ask another question.
5. Select a collection and ask another question.
6. Confirm citations appear on supported answers and absent on unsupported answers.
7. Set `ANSWER_PROVIDER=gemini`, `GEMINI_API_KEY`, and optional `GEMINI_MODEL=gemini-3.8-flash`, then restart the dev server for a Gemini provider check.
