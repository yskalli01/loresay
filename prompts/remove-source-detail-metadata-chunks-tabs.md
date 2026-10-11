# Remove the Metadata and Chunks tabs from the source detail view

## Goal

Reduce the source detail page tab bar from four tabs (`Content`, `Metadata`, `Chunks`, `Citations`) to two (`Content`, `Citations`), without losing any information the page already exposes elsewhere.

## Skills read

Read `AGENTS.md`.

Read `/develop` build flow and logical guide if they are installed under `.agents/skills\develop\`.

## Code inspected

Read `src\app\sources\[sourceId]\page.tsx`.

Read `src\presentation\app\source-detail-tabs.tsx`.

Searched `SourceDetailTabs`, `metadataRows`, `MetadataRow`, `tablist`, `chunks`, and `Chunks` across `src` and `docs`.

Read `src\app\page.test.tsx` for the route render test pattern used by the workspace navigation tests.

## Decisions and assumptions

1. The user asked only to remove two tabs. The right sidebar `Metadata` card on the same page already renders the full `metadataRows` list, so removing the `Metadata` tab loses no information.
2. The `Chunks` tab currently renders only a static placeholder, "Chunk details are not available in this source view yet." It never showed real chunk data, so removing it removes no capability.
3. After removal the component keeps only two tabs. A two tab control is still meaningful, so keep the existing `tablist` markup, `aria-selected`, `aria-controls`, `role="tabpanel"`, and keyboard focus outline behavior instead of flattening the layout. Do not restyle anything.
4. Drop the now unused `metadataRows` prop and the local `MetadataRow` type from `source-detail-tabs.tsx`. The page keeps its own `metadataRows` array and its own `MetadataRow` presentational component because the sidebar still renders them.
5. Keep the `Active chunks` metric and every other chunk concept in the rest of the app untouched. This is a UI removal only.
6. Do not touch `docs\specs\` or `docs\scope\` unless a test asserts tab text there. Checked: none do.

## Files expected to change

`src\presentation\app\source-detail-tabs.tsx`

`src\app\sources\[sourceId]\page.tsx` (drop the `metadataRows` prop and its local `MetadataRow` type)

`src\app\page.test.tsx` only if a test asserts the removed tab labels.

## Requirements

1. The source detail tab bar renders exactly two tabs: `Content` and `Citations`.
2. The words `Metadata` and `Chunks` no longer appear as tab labels in that component.
3. `Content` still shows the active extracted text, or its existing empty state.
4. `Citations` still shows its existing empty state.
5. The right sidebar `Metadata` card on the source detail page still renders every metadata row exactly as before, including `Source ID` and `Fingerprint`.
6. Accessible tab semantics stay intact: `role="tablist"`, one `role="tab"` per tab with `aria-selected` and `aria-controls`, one `role="tabpanel"` with `aria-labelledby` pointing at the active tab, and visible focus rings.
7. No other page, route, or component changes.

## Security considerations

None. This is presentational only. No data access, owner scoping, or export behavior changes.

## Acceptance criteria

- Visiting a source detail page shows only `Content` and `Citations` tabs.
- Clicking `Citations` shows the existing no citations message.
- Clicking `Content` shows the extracted text for a processed source, or the existing no extracted text message.
- The sidebar `Metadata` card still lists `Source ID`, `Fingerprint`, and every metadata entry.
- Keyboard tab navigation and visible focus outlines still work on both tabs.
- No other source detail behavior changes.

## Checks to run

1. `pnpm run test:core`
2. `pnpm run typecheck`
3. `pnpm run lint`

## Manual test steps

1. Run `pnpm run dev`.
2. Go to `http://localhost:3000/sources`.
3. Click any row to open a source detail page.
4. Confirm the tab bar shows only `Content` and `Citations`.
5. Click `Citations` and confirm the existing message renders.
6. Click `Content` and confirm the extracted text or the empty state renders.
7. Scroll the right sidebar and confirm the `Metadata` card still lists `Source ID`, `Fingerprint`, and the source metadata entries.
8. Press Tab until a tab button has focus and confirm the focus ring is visible.
