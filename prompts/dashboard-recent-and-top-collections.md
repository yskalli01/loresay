# Dashboard: cap Recent Activity at 5 and show Top 5 collections by source count

## Goal

On the dashboard (`/`):

1. **Recent Activity** card shows only the 5 most recently updated sources (currently it can show up to 6).
2. **Top Collections** card shows only the 5 collections with the most sources, ordered by source count descending (currently it lists every collection, alphabetically).

No other visible change: card layout, empty states, and the metric row stay exactly as they are.

## Skills read

- `AGENTS.md` (repo loop, Clean Architecture rules, tooling commands).
- Next.js 16.3.4 docs in `node_modules/next/dist/docs/` (rule 12) — no routing/`next/script` surface is involved in this change, so nothing from those guides applies beyond confirming the page is a plain async Server Component.

No Supabase schema or RLS work is involved (no table/column/policy changes), so the Supabase skills are not needed. No AI provider surface is touched.

## Code inspected

- `src/app/page.tsx` — dashboard page.
  - Line 66: Collections metric uses `dashboard.collections.length` (the **total** count).
  - Lines 87-113: Recent Activity maps over `dashboard.sources` with no cap.
  - Lines 127-145: Top Collections maps over `dashboard.collections` with no cap, showing `collection.source_count` already.
- `src/infrastructure/db/knowledge-repository.ts`
  - `getDashboardSummary` (line 1316): fetches sources with `limit: 6` (line 1320) and all collections via `listCollections` (line 1358).
  - `listKnowledgeSources` (line 543): ordered by `desc(updatedAt), desc(id)` — so the first N are the most recently updated.
  - `listCollections` (line 923-942): supports `filters.sort`, including `"source_count"` (count desc, then name), but `getDashboardSummary` calls it unsorted (alphabetical) and returns the full list.
- `src/app/chat/page.tsx:14` — **also** consumes `getDashboardSummary().collections` as the collection picker for `ChatPanel`. This is why the cap must NOT be applied inside `getDashboardSummary`.
- `src/application/knowledge/repositories.ts:447` — `getDashboardSummary` DTO shape.
- `src/app/page.test.tsx` — fixtures (`sources`, 3 items; `collections`, 2 items) and assertions, including line 285 which asserts the Collections metric value is `2`.

## Decisions and assumptions

1. **Cap in the presentation layer (`src/app/page.tsx`), not in the repository.**
   Reason: `getDashboardSummary` is shared with `/chat`, which needs the full collections list. Slicing there would silently shrink the chat collection picker.
2. **The Collections metric keeps showing the true total.** It uses `dashboard.collections.length` (full list), so capping the card does not change the metric. This preserves the existing assertion at `page.test.tsx:285`.
3. **Recent Activity = first 5 of the existing `updatedAt` desc ordering.** Implement as `dashboard.sources.slice(0, 5)`; also drop the repository fetch from `limit: 6` to `limit: 5` so the query matches what is displayed.
4. **Top Collections ordering:** `source_count` descending, ties broken by `name` ascending (deterministic, mirrors the repository's existing `sort: "source_count"` tie-break), then `.slice(0, 5)`.
   Assumption: collections with `source_count === 0` are still eligible (they simply sort last). If fewer than 5 collections have sources, the remaining slots are filled by zero-source collections rather than the card being filtered.
5. The list is sorted on a copy (`[...dashboard.collections].sort(...)`) so the shared DTO array is never mutated.

## Files to touch

1. `src/app/page.tsx`
   - Compute `recentSources = dashboard.sources.slice(0, 5)` and `topCollections = [...dashboard.collections].sort(bySourceCountDescThenName).slice(0, 5)` in the async server component body, then render those.
   - Metric row unchanged.
2. `src/infrastructure/db/knowledge-repository.ts`
   - `getDashboardSummary`: `limit: 6` → `limit: 5`.
3. `src/app/page.test.tsx`
   - New test using `getDashboardSummary.mockResolvedValueOnce` with 7 sources and 7 collections (distinct titles/names, distinct `source_count` values) asserting:
     - only the 5 newest sources render (the 6th/7th titles are absent),
     - only 5 collections render, in descending `source_count` order,
     - the Collections metric still shows the full count (7).

No changes to `src/application/knowledge/repositories.ts`, the test stubs in `thin-loop.test.ts` / `use-cases.test.ts`, or any DTO.

## Requirements

- Recent Activity renders at most 5 rows, most recently updated first.
- Top Collections renders at most 5 rows, most sources first, ties by name A→Z.
- Collections metric still shows the total number of collections.
- Empty states unchanged (`No activity yet...` / `Collections appear here...`).
- No layout, styling, or markup changes beyond the reduced row count.
- Strict TypeScript: no `any`; sorting comparator typed against `CollectionSummaryDto`.

## Security considerations

- None new. All data still comes from `getDashboardSummary`, which is already owner-scoped by `requireSessionUser()` + `owner = { userId: user.id }`. RLS and query ownership are untouched.

## Acceptance criteria

1. Dashboard with >5 sources renders exactly 5 Recent Activity rows.
2. Dashboard with >5 collections renders exactly 5 Top Collections rows ordered by source count desc.
3. Collections metric equals the total collection count, not 5.
4. `/chat` still receives the full collections list (unchanged behavior).
5. `lint`, `typecheck`, `test` all pass.

## Checks to run

```bash
pnpm.cmd run lint
pnpm.cmd run typecheck
pnpm.cmd run test
```

(`pnpm run quality` stops early on ~33 pre-existing unrelated `format:check` failures, so use the three commands above, or `pnpm.cmd run quality:deadline`.)

## Manual test steps

1. Ensure the dev server is running (`pnpm.cmd run dev`), open `http://localhost:3000`.
2. Sign in.
3. On the dashboard:
   - Count the rows under **Recent Activity** → exactly 5 (or fewer if you have fewer than 5 sources), newest at the top.
   - Count the rows under **Top Collections** → exactly 5 (or fewer if you have fewer than 5 collections), each showing `N sources` in descending order.
   - The **Collections** metric tile still shows the real total number of collections.
4. Go to `/chat` and confirm the collection picker still lists every collection (not just 5).
