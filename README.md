# AI Personal Knowledge Base

A Next.js app for saving private knowledge and asking grounded questions with citations.

## Deadline Workflow

Use the fast path while building the MVP:

```bash
pnpm install
pnpm run dev
pnpm run quality:deadline
```

Run the full gate before final delivery or merge:

```bash
pnpm run quality
```

## Useful Commands

```bash
pnpm run dev
pnpm run lint
pnpm run typecheck
pnpm run test:core
pnpm run test
pnpm run build
```

## Local Providers

Use the stub AI provider for local verification without paid provider calls:

```bash
AI_PROVIDER=stub
ANSWER_PROVIDER=stub
```

Use Gemini for retrieval embeddings and answers when you only have a Gemini key:

```bash
AI_PROVIDER=gemini
ANSWER_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
```

Use OpenAI only when checking OpenAI provider behavior or production settings:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=...
```

If you change embedding providers, reprocess saved sources so stored vectors match the active provider.

## Scope

The active deadline scope lives in [docs/scope/scope.md](docs/scope/scope.md).
The original broader plan is preserved in [docs/scope/scope-original-plan.md](docs/scope/scope-original-plan.md).

