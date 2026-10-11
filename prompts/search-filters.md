# Search page filters (type, collection, time)

## Goal

Make the three filters on the Search page functional: type, collection, and time. Today they render as static selects with a single option each and change nothing. After this change, picking a value narrows the result list, keeps the query and page state coherent, and survives pagination.

## Guidance read

- `AGENTS.md`
- `/develop` skill guidance
- Design reference `design/ui.png` (screen 9, Search) and `design.md`
- Current search page `src/app/search/page.tsx`
- Current search form `src/presentation/app/search-query-form.tsx`
- Working filter pattern `src/presentation/app/source-filter-bar.tsx` (`parseSourceFilters`)
- Repository contract `src/application/knowledge/repositories.ts` (`SourceListFilters`)
- Drizzle repository `src/infrastructure/db/knowledge-repository.ts` (`listKnowledgeSources`)
- Existing route tests `src/app/page.test.tsx`

## Code inspected

- `src/app/search/page.tsx` reads only `q` and `page`, then calls `listKnowledgeSources` with `filters: query ? { query } : {}`. Type, collection, and time never reach the query.
- `src/presentation/app/search-query-form.tsx` renders three selects with one hardcoded option each, no `name`, no state, no handler.
- `listKnowledgeSources` already supports `type`, `status`, `query`, `collectionId`, `createdFrom`, and `createdTo` (date only, `created_at` column, inclusive to via `+ interval '1 day'`).
- `parseSourceFilters` on the sources page shows the established shape: parse URL params in presentation, pass a `SourceListFilters` object down, render selects from the same parsed value.
- `SourcePagination` copies every search param except `page` into page links, so any filter we put in the URL is preserved while paging.
- `knowledgeRepository.listCollections({ owner })` already returns the signed in user's collections and is used by the sources page.

## Decisions and assumptions

- User chose preset time ranges over date pickers: one select stays, matching the design reference.
- The time filter writes a preset key to the URL (`time=today|7d|30d|90d|year`) rather than literal dates, and the server resolves that key to a `createdFrom` / `createdTo` pair. The URL stays short and stable, the rendered `selected` option can never disagree between server and client, and the repository keeps using its existing date filters.
- Date math uses the server's local calendar day (Vercel runs UTC). Presets are day granularity, so this is a coarse filter, not an accounting boundary.
- Filters apply immediately on change with `router.replace`, no Apply button. The design reference has no Apply button on the Search screen, and the query input already applies itself this way.
- Changing any filter resets `page` to 1, otherwise a filter change can land on a page past the end of the new result set.
- Query, type, collection, and time combine with AND, and the existing 250ms debounce for `q` is untouched.
- The select markup keeps its current classes and gains the design system focus and hover states used by `FilterSelect` (tokens only, no new values), because `design.md` requires visible focus states on selects.
- Selects get real accessible names via `sr-only` label text; they currently have none.
- The `collection` param is validated as a UUID before use so a crafted URL cannot send a non uuid into a uuid column comparison and 500 the page.

## Files to touch

- `src/presentation/app/search-filters.ts` (new): `parseSearchFilters`, preset list, `resolveSearchTimeRange(preset, now)`.
- `src/presentation/app/search-filters.test.ts` (new): unit coverage for parsing and date math.
- `src/app/search/page.tsx`: parse filters, resolve the time window, fetch collections in parallel, pass them to the repository and the form.
- `src/presentation/app/search-query-form.tsx`: three controlled selects wired to the URL.
- `src/app/page.test.tsx`: route coverage for filter pass through and rendered options.

## Requirements

1. Parse `type`, `collection`, and `time` from `searchParams`.
   - `type` accepts only `note`, `document`, `url`; anything else is ignored.
   - `collection` accepts only a string matching the UUID shape; anything else is ignored.
   - `time` accepts only `today`, `7d`, `30d`, `90d`, `year`; anything else is ignored.
2. Resolve the preset to a date window relative to a supplied `now`:
   - `today`: today to today
   - `7d`: today minus 6 days to today (inclusive window of 7 days)
   - `30d`: today minus 29 days to today
   - `90d`: today minus 89 days to today
   - `year`: January 1 of the current year to today
   - Format both ends as `YYYY-MM-DD`; no preset means no `createdFrom` / `createdTo`.
3. Build the repository filters object with only the keys that have values, so unset filters are absent rather than `undefined` filled.
4. Fetch collections with `Promise.all` alongside `listKnowledgeSources`, scoped to the session user.
5. Render three selects in the existing `grid gap-3 md:grid-cols-3` row, with options:
   - Type: `All Types`, `Note`, `Document`, `URL`
   - Collection: `All Collections`, then the user's collections by name and id
   - Time: `Any Time`, `Today`, `Last 7 days`, `Last 30 days`, `Last 90 days`, `This year`
6. Each select is controlled by the URL value, updates the URL on change, and clears `page` while preserving `q` and the other filters.
7. Each select carries an `sr-only` label: `Filter by type`, `Filter by collection`, `Filter by time`.
8. Keep result cards, the result count line, pagination, and the debounce behavior unchanged.

## Security considerations

- Keep the existing `owner: { userId: user.id }` scoping on both repository calls; no filter may widen visibility.
- Reject malformed `type` and `collection` values at parse time instead of passing them into SQL.
- Keep using Drizzle condition builders with bound values, no string interpolation into SQL.
- Deleted sources stay excluded through the existing repository behavior.

## Acceptance criteria

- `/search?type=url` sends `type: "url"` to `listKnowledgeSources` and drops non url results.
- `/search?collection=<uuid>` sends `collectionId: "<uuid>"`.
- `/search?time=30d` sends a `createdFrom` 29 days before `createdTo`, both `YYYY-MM-DD`, and `createdTo` is today.
- `/search?type=note&collection=<uuid>&time=7d&q=treeset` sends all four together.
- Junk values (`type=banana`, `collection=abc`, `time=soon`) are ignored and the page still renders.
- The three selects render with all options, the user's collections listed, and the current URL value marked selected.
- Changing a select updates the URL without losing `q`, and pagination links keep every filter.
- Each select is reachable by keyboard, shows a focus ring, and has an accessible name.
- `resolveSearchTimeRange` is covered for every preset with a fixed `now`.
- Existing sources, collections, notes, chat, settings, and search tests keep passing.

## Checks to run

1. `pnpm run typecheck`
2. `pnpm run lint`
3. `pnpm run test:core`
4. `pnpm run test`
5. `pnpm run quality:deadline`

## Manual test steps

1. Run `pnpm run dev` and open `http://localhost:3000/search`.
2. Pick `Note` under type. Confirm the URL gains `type=note` and only notes remain.
3. Pick a collection. Confirm the URL keeps `type=note`, adds `collection=<id>`, and the list narrows to that collection.
4. Search for a term that matches nothing in that collection. Confirm `0 results found` and that the URL keeps `q`, `type`, and `collection`.
5. Set time to `Last 30 days` and confirm results are limited to recently added sources.
6. Clear the search box. Confirm `q` disappears while `type`, `collection`, and `time` stay.
7. Set time to `Any Time`, type to `All Types`, collection to `All Collections`. Confirm the full list returns and all three params leave the URL.
8. With a filter set and more than five results, page forward. Confirm page links keep every filter.
9. Tab into each select. Confirm a visible focus ring and that the accessible name is announced.
10. Open `/search?type=banana&collection=abc&time=soon`. Confirm the page renders normally with no error.
