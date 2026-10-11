# Source detail tabs

## Goal

Make the source detail page tabs clickable. The existing labels `Content`, `Metadata`, `Chunks`, and `Citations` should behave like real tabs instead of static text.

## Skills read

- Root `AGENTS.md`
- `/develop` skill at `C:\Users\yskal\.agents\skills\develop\SKILL.md`
- `/develop` build flow at `C:\Users\yskal\.agents\skills\develop\flow\build.md`

## Code inspected

- `src/app/sources/[sourceId]/page.tsx`
- `src/infrastructure/db/knowledge-repository.ts`
- `src/application/knowledge/repositories.ts`
- `src/presentation/app/source-edit-form.tsx`
- `src/presentation/ui/button.tsx`
- Related references for content, metadata, chunks, and citations across `src/app`, `src/application`, and `src/infrastructure/db`

## Decision and assumptions

This is a local UI implementation fix. No architecture decision is owed.

The page already has the source detail data needed for content and metadata. It does not currently expose source chunks or citation rows on `SourceDetailDto`, so this slice will make the tabs clickable and show useful panels without expanding the repository contract unless a tiny local display field is already available. If chunks or citations are not available from the current source detail DTO, those tabs will show clear empty states instead of pretending the data is loaded.

The existing source detail route stays server rendered. I will add a small client component for tab state if needed.

## Expected files to touch

- `src/app/sources/[sourceId]/page.tsx`
- likely new `src/presentation/app/source-detail-tabs.tsx`
- `src/app/page.test.tsx` or a focused presentation test if the tab component can be tested cleanly

## Requirements

1. The `Content`, `Metadata`, `Chunks`, and `Citations` controls are clickable tabs.
2. The active tab has the same visual treatment the current `Content` label has.
3. The inactive tabs have a normal inactive style and keyboard focus states.
4. The `Content` tab shows the current extracted content panel.
5. The `Metadata` tab shows source id, fingerprint, and metadata values.
6. The `Chunks` tab shows an empty state if chunk details are not available in the current DTO.
7. The `Citations` tab shows an empty state if citation details are not available in the current DTO.
8. The edit note section, organization panel, settings panel, and metadata side card should not disappear unexpectedly unless replaced by the tab panel intentionally.
9. Keep the visual style aligned with the current design tokens and existing card patterns.
10. Do not add a new route.

## Security considerations

- Keep all data loaded through the existing owner scoped source detail repository call.
- Do not expose raw data from another user.
- Do not add client side fetching or API routes for this fix.

## Acceptance criteria

- Clicking `Content` shows content.
- Clicking `Metadata` shows metadata.
- Clicking `Chunks` changes the visible panel.
- Clicking `Citations` changes the visible panel.
- The tabs use accessible tab semantics or equivalent button controls with clear active state.
- Existing source detail actions still render.

## Checks to run

1. `pnpm run typecheck`
2. `pnpm exec vitest run src\app\page.test.tsx`
3. `pnpm run lint`

## Manual test steps

1. Open `http://localhost:3000/sources`.
2. Open any source row with the title link or the row actions `Show` option.
3. Click `Content` and confirm extracted content appears.
4. Click `Metadata` and confirm source id, fingerprint, and metadata appear.
5. Click `Chunks` and confirm the visible panel changes from content to the chunks panel or its empty state.
6. Click `Citations` and confirm the visible panel changes from content to the citations panel or its empty state.
7. Confirm source settings and organization controls still appear on the page.