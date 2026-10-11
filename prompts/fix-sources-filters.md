# Fix sources page filters

## Goal

Make the filter control on `/sources` useful. The page should show the existing source filter form, let the user filter by search text, type, status, and collection, and pass those values to the source repository.

## Skills read

Read `AGENTS.md`.

Read `/develop` at `C:\Users\yskal\.agents\skills\develop\SKILL.md`.

Read `/develop` build flow at `C:\Users\yskal\.agents\skills\develop\flow\build.md`.

Read `/develop` UI guide and existing design route at `C:\Users\yskal\.agents\skills\develop\ui-guide.md` and `C:\Users\yskal\.agents\skills\develop\ui\existing.md`.

Read the UI implementation guide at `C:\Users\yskal\.agents\skills\develop\ui\implementation.md`.

Read Next.js local docs for App Router pages, search params, and server data fetching in `node_modules\next\dist\docs\01-app\01-getting-started\03-layouts-and-pages.md` and `node_modules\next\dist\docs\01-app\01-getting-started\06-fetching-data.md`.

## Code inspected

Read `src\app\sources\page.tsx`.

Read `src\presentation\app\source-filter-bar.tsx`.

Read `src\application\knowledge\repositories.ts`.

Read `src\infrastructure\db\knowledge-repository.ts`.

Read `src\app\collections\page.tsx`.

Read `src\app\page.test.tsx`.

Read `design.md`.

## Decisions and assumptions

This is a small bug fix, not a new architecture decision.

The source filter behavior already exists in `SourceFilterBar`, `parseSourceFilters`, and `listKnowledgeSources`.

The fix should reuse that existing component and repository contract instead of creating a new filter UI.

The page should fetch collections in parallel with sources so the filter dropdown has real options.

The table should stay visually consistent with the current design system.

## Files expected to change

`src\app\sources\page.tsx`

`src\app\page.test.tsx`

## Requirements

Use `parseSourceFilters` in the sources page.

Render `SourceFilterBar` above the sources table.

Pass `filters` to `knowledgeRepository.listKnowledgeSources`.

Fetch `knowledgeRepository.listCollections` for filter options.

Keep the existing source type tabs or replace only if the existing filter bar fully covers the behavior without making the page less usable.

Remove dead local parsing helpers if no longer needed.

Preserve the Add Source link, table columns, empty state, and source detail links.

Update route tests so the source page proves the filter controls render and submitted filters reach the repository.

## Security considerations

Keep all source and collection data scoped to the current `owner`.

Do not expose archived or purged sources through the filter change.

Do not add client side data fetching or leak database access to the browser.

Continue using sanitized typed filters from `parseSourceFilters`.

## Acceptance criteria

The `/sources` page displays usable filter controls, including type, status, and collection.

Submitting filter query params changes the repository call filters.

The source list still renders as a table.

The route test covers the filter UI and repository filter call.

## Checks to run

Run `pnpm run test:core`.

Run `pnpm run typecheck`.

If those fail for unrelated existing work, report the failing command and the first useful failure.

## Manual test steps

Visit `http://localhost:3000/sources`.

Confirm the filter panel is visible above the table.

Choose a type, status, collection, then select Apply filters.

Confirm the URL contains the selected query params.

Confirm the table shows matching sources or the no results state.

Select Clear filters.

Confirm the page returns to `/sources` with no active filters.
