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

Use the stub AI provider for local verification without OpenAI credits:

```bash
AI_PROVIDER=stub
```

Use OpenAI only when checking provider behavior or production settings:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=...
```

## Scope

The active deadline scope lives in [docs/scope/scope.md](docs/scope/scope.md).
The original broader plan is preserved in [docs/scope/scope-original-plan.md](docs/scope/scope-original-plan.md).
