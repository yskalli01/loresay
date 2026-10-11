# Fix UI reference routing and page fidelity

## Goal

Bring the current application closer to `design/ui.png` for the screens the user called out.

## Skills read

- `AGENTS.md`
- `/develop` at `C:\Users\yskal\.agents\skills\develop\SKILL.md`
- Next.js App Router docs:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`

## Code inspected

- `src/presentation/app/navigation.ts`
- `src/presentation/app/app-shell.tsx`
- `src/app/sources/page.tsx`
- `src/app/sources/[sourceId]/page.tsx`
- `src/app/chat/page.tsx`
- `src/presentation/app/chat-panel.tsx`
- `src/presentation/app/source-filter-bar.tsx`
- `src/presentation/app/privacy-lifecycle-panel.tsx`
- `src/app/page.test.tsx`

## Decisions and assumptions

- The desktop image is the source of truth.
- `Sources`, `Collections`, `Search`, and `Settings` must use distinct routes and distinct page UIs.
- Existing data from `knowledgeRepository` is enough for the visual correction.
- This pass will not add new backend behavior.
- `Source Settings` belongs on source detail, reached by clicking a source from the table.
- The shared `AppShell` remains, with active navigation set by each route.

## Files expected to change

- `src/presentation/app/navigation.ts`
- `src/app/sources/page.tsx`
- `src/app/sources/[sourceId]/page.tsx`
- `src/app/chat/page.tsx`
- `src/presentation/app/chat-panel.tsx`
- `src/presentation/app/privacy-lifecycle-panel.tsx`
- New route pages as needed:
  - `src/app/collections/page.tsx`
  - `src/app/search/page.tsx`
  - `src/app/settings/page.tsx`
- Tests:
  - `src/app/page.test.tsx`
  - `src/presentation/architecture-boundary.test.ts`

## Requirements

1. Navigation routes must be distinct:
   - Dashboard: `/`
   - Sources: `/sources`
   - Collections: `/collections`
   - Chat: `/chat`
   - Search: `/search`
   - Settings: `/settings`
2. Sources must match the library screen in `design/ui.png`:
   - Header title `Sources`.
   - Add Source button at the top right.
   - Compact search field and Filter button row.
   - Source type tabs for All, Notes, Documents, and URLs.
   - Table with checkbox, title, type, collection, added, and actions columns.
   - No Source Settings sidebar on the library page.
3. Source Settings must display after clicking a source:
   - Source detail route includes the full Source Settings panel from the lifecycle screen.
   - Reprocess, Archive, Export, and Permanently Delete actions appear on detail.
4. Chat must match the chat screen more closely:
   - Main title `Chat with Your Knowledge`.
   - Conversation style answer card.
   - Suggested question chip near the top.
   - Source citation card in the answer area.
   - Bottom input bar with send icon.
   - Keep the existing streaming chat behavior.
5. Collections must have its own collections grid page like screen 7.
6. Search must have its own search results page like screen 9.
7. Settings must have its own settings page like screen 13.
8. Preserve the MDXEditor work already added for notes.
9. Keep accessibility basics: labels, landmarks, focusable controls, and useful link text.

## Security considerations

- Do not expose source content beyond the signed in user's repository calls.
- Keep server data access in route pages through `requireSessionUser` and `knowledgeRepository`.
- Avoid adding client side data fetching for private source lists.
- Keep destructive delete UI behind the existing server action and confirmation input.

## Acceptance criteria

1. The sidebar no longer links Sources, Collections, Search, and Settings to the same page.
2. `/sources` renders the table library view and an Add Source button.
3. `/sources` does not render Source Settings.
4. `/sources/source-1` renders Source Settings.
5. `/chat` visibly changes to the reference chat layout.
6. `/collections`, `/search`, and `/settings` render separate reference matched pages.
7. Route and boundary tests assert the distinct navigation and page content.
8. `pnpm run quality:deadline` passes.
9. `pnpm run quality` passes before delivery.

## Checks to run

1. `pnpm run format`
2. `pnpm run quality:deadline`
3. `pnpm run quality`

## Manual test steps

1. Start the app with `pnpm run dev`.
2. Open `/` and confirm the sidebar links are distinct.
3. Open `/sources` and confirm the library table matches screen 2.
4. Click a source and confirm the detail page shows Source Settings like screen 12.
5. Open `/chat` and confirm the chat layout matches screen 8.
6. Open `/collections`, `/search`, and `/settings` and confirm each page is unique.
