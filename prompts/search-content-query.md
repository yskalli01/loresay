# Search content query

## Goal

Make the Search page useful for saved knowledge. The search input should load empty by default, not with sample text, and submitting a query should search across each owned source title and its active saved content.

## Guidance read

- `AGENTS.md`
- `/develop` skill guidance
- Supabase skill guidance
- Supabase Postgres best practices guidance for query and join columns
- Current search page at `src/app/search/page.tsx`
- Knowledge repository contract at `src/application/knowledge/repositories.ts`
- Drizzle repository implementation at `src/infrastructure/db/knowledge-repository.ts`
- Existing route tests at `src/app/page.test.tsx`

## Code inspected

- `src/app/search/page.tsx` defaults `q` to `neural networks`.
- `src/infrastructure/db/knowledge-repository.ts` only filters `filters.query` with `ilike(knowledge_sources.title, pattern)`.
- `listKnowledgeSources` already joins active `source_contents`, returns active content snippets, scopes rows by `owner.userId`, and excludes deleted sources.
- Existing page tests render the search page but do not assert the default query or repository filter arguments.

## Decisions and assumptions

- This is a small implementation fix, not a new architecture decision.
- Blank `/search` should show an empty input and list the recent owned sources using the existing repository behavior.
- A non blank `q` should search active source content as well as titles.
- Use Drizzle condition helpers and parameterized values, not raw string interpolation.
- Keep the existing UI structure and visual styling.
- Do not add a schema migration or full text index in this slice. The MVP query will be case insensitive substring search. If the source library grows large, a later slice can add Postgres full text search or trigram indexes.

## Files to touch

- `src/app/search/page.tsx`
- `src/infrastructure/db/knowledge-repository.ts`
- `src/app/page.test.tsx`

## Requirements

- Remove the sample `neural networks` default.
- Trim incoming search text before using it as a filter value.
- Search source titles and active saved content text.
- Preserve current owner scoping, deleted source exclusion, and existing type, status, and collection filters.
- Preserve existing result cards and snippets.
- Add coverage that proves the default search is blank and query text is passed through.

## Security considerations

- Keep all searches scoped to the signed in user.
- Keep deleted sources excluded.
- Use Drizzle query builders and bound values for search patterns.
- Do not expose source content from other users through joins or filter shortcuts.

## Acceptance criteria

- Visiting `/search` renders an empty search input.
- Visiting `/search?q=treeset` sends `treeset` to `listKnowledgeSources`.
- Repository search matches a title containing the query.
- Repository search matches active saved content containing the query.
- Empty or whitespace only queries do not apply a search condition.
- Existing sources, collections, notes, chat, and settings route tests keep passing.

## Checks to run

1. `pnpm run typecheck`
2. `pnpm run lint`
3. `pnpm run test:core`
4. `pnpm run test`
5. `pnpm run quality:deadline`

## Manual test steps

1. Open `http://localhost:3000/search`.
2. Confirm the search box is empty.
3. Search for text that appears only inside a saved source body.
4. Confirm that source appears in the results.
5. Search for a title fragment.
6. Confirm the title match still appears.
7. Search for nonsense text.
8. Confirm the page shows zero results without an error.
