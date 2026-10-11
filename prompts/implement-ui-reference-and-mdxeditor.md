# Rebuild UI from ui reference and add markdown editor

## Goal

Update the application UI to match `design/ui.png` as the new product reference, and replace plain note textareas with an appropriate rich markdown editor, preferably MDXEditor.

The reference image is the source of truth for layout, spacing, color, typography, navigation, cards, tables, editor treatment, upload areas, source details, chat, settings, notifications, and mobile behavior.

## Skills and guidance read

1. Root `AGENTS.md`
2. `/develop` UI workflow from the previous turn remains the governing implementation workflow
3. Local Next.js docs for layouts and pages
4. Local Next.js docs for server and client components
5. Local Next.js docs for CSS
6. MDXEditor official getting started docs

## Code and project context inspected

1. `design/ui.png`
2. `design.md`
3. `package.json`
4. `next.config.ts`
5. `src/app/globals.css`
6. `src/app/layout.tsx`
7. `src/app/page.tsx`
8. `src/app/notes/page.tsx`
9. `src/presentation/app/app-shell.tsx`
10. `src/presentation/app/note-form.tsx`
11. `src/presentation/app/source-edit-form.tsx`
12. `src/presentation/app/source-summary-grid.tsx`
13. `src/presentation/app/source-filter-bar.tsx`
14. `src/presentation/app/chat-panel.tsx`
15. `src/presentation/ui/*` shared primitives
16. Current tests around routes, primitives, globals, and architecture boundaries

## Decisions and assumptions

1. This is a UI implementation pass against a supplied image, not an architecture rewrite.
2. The app should keep Next.js App Router, Tailwind CSS, local primitives, and Clean Architecture boundaries.
3. The UI should move from the previous design sheet look to the actual app screens in `design/ui.png`.
4. The reference shows a compact product shell with a fixed left sidebar, top search area, notification and avatar icons, white content panels, pale blue canvas, purple active states, and dense app pages.
5. The markdown editor should use `@mdxeditor/editor` if installation succeeds.
6. MDXEditor must be loaded client side only because its official docs say it does not support server rendering in Next.js App Router.
7. The editor will keep saving plain markdown text through the existing server actions by mirroring the editor value into a hidden `body` field.
8. If MDXEditor cannot install or build cleanly with this stack, fall back to a local markdown toolbar plus textarea rather than leaving the note flow broken.
9. No database schema, source processing, auth, RLS, AI provider, or API behavior should change.
10. Existing uncommitted files from earlier work must be preserved.

## Expected files to touch

1. `package.json`
2. `pnpm-lock.yaml`
3. `design.md`
4. `src/app/globals.css`
5. `src/app/page.tsx`
6. `src/app/notes/page.tsx`
7. `src/app/ingestion/page.tsx`
8. `src/app/chat/page.tsx`
9. `src/app/sources/page.tsx`
10. `src/app/sources/[sourceId]/page.tsx`
11. `src/presentation/app/app-shell.tsx`
12. `src/presentation/app/page-header.tsx`
13. `src/presentation/app/note-form.tsx`
14. `src/presentation/app/source-edit-form.tsx`
15. `src/presentation/app/source-filter-bar.tsx`
16. `src/presentation/app/source-summary-grid.tsx`
17. `src/presentation/app/chat-panel.tsx`
18. `src/presentation/ui/*`
19. New editor wrapper files under `src/presentation/app` or `src/presentation/ui`
20. Existing tests where text or structure changes require updates

## Requirements

1. Match the overall layout and visual language of `design/ui.png` across the app.
2. Keep the left navigation compact, pale, and stable across routes.
3. Add a top bar pattern with search styling, notification icon treatment, and account avatar treatment where practical.
4. Make overview/dashboard cards match the reference: quick add tiles, metrics, recent activity, and collections styling.
5. Make sources library resemble the reference with search/filter row, tabs or segmented filters, table density, checkboxes, and row actions where practical with existing data.
6. Make source details use a header and tabbed content visual treatment when possible without changing behavior.
7. Make note creation and note editing use the rich markdown editor and preserve existing save and reprocess server actions.
8. Support common markdown authoring controls: headings, bold, italic, lists, links, and markdown shortcuts at minimum.
9. Make upload, URL, collections, search, lifecycle, export, and notification surfaces align with the reference where those screens already exist.
10. Preserve mobile usability by stacking panels and keeping touch targets at least 44px.
11. Keep all meaningful controls labelled and keyboard usable.
12. Do not introduce broad `any` types.
13. Do not import infrastructure or domain modules into presentation primitives.
14. Do not remove existing MVP flows.

## MDXEditor implementation plan

1. Install `@mdxeditor/editor` with pnpm.
2. Add a client only initialized editor file that imports MDXEditor plugins.
3. Use `next/dynamic` with `ssr: false` for the exported editor wrapper.
4. Import `@mdxeditor/editor/style.css` only from the editor client boundary or global CSS path as required by the package.
5. Enable headings, lists, quote, link, markdown shortcut, and toolbar plugins if supported by the installed package version.
6. Mirror editor markdown to a hidden input named `body` for the existing server action forms.
7. Keep a no script or loading fallback textarea style only if needed for build stability.
8. Style MDXEditor classes in `globals.css` so the editor matches the reference toolbar and content panel.

## Security considerations

1. The editor captures user authored markdown only and submits it through existing validated actions.
2. Do not render arbitrary MDX output as executable React components in the app.
3. Do not expose API keys or server only modules to the editor client bundle.
4. Do not bypass ownership checks or validation in existing actions.
5. Avoid remote image upload or embedding features unless already supported safely.
6. Preserve current source validation and URL ingestion protections.

## Acceptance criteria

1. The app shell and main routes visually align with `design/ui.png`.
2. Notes can be created through the markdown editor and still reach `createTextNoteAction`.
3. Existing notes can be edited and reprocessed through the markdown editor and still reach `updateTextNoteAction`.
4. The editor loads without SSR or hydration errors.
5. The editor stores markdown text, not rendered HTML or executable MDX.
6. Existing tests pass or are updated to reflect intentional UI copy and structure changes.
7. `pnpm run quality:deadline` passes.
8. `pnpm run quality` passes before final delivery if dependencies install and the build environment allows it.
9. No design reference files are modified.

## Checks to run

1. `pnpm add @mdxeditor/editor`
2. `pnpm run lint`
3. `pnpm run typecheck`
4. `pnpm run test:core`
5. `pnpm run quality:deadline`
6. `pnpm run quality`

## Manual test steps

1. Start the app with `AI_PROVIDER=stub pnpm run dev`.
2. Visit `/` and compare the dashboard shell, sidebar, quick actions, metrics, activity, and collections against the reference.
3. Visit `/notes`.
4. Type markdown with a heading, bold text, bullet list, and link in the editor.
5. Save and confirm the note is processed through the existing flow.
6. Edit a saved note, change markdown content, and confirm reprocess works.
7. Visit `/sources` and confirm the library search, filters, list or table, badges, and actions match the reference direction.
8. Visit a source detail page and confirm the header, metadata, content panel, and actions match the reference direction.
9. Visit `/ingestion`, `/chat`, and lifecycle/export surfaces to confirm they share the same shell and component language.
10. Test keyboard focus through sidebar, top search, editor toolbar, editor body, and submit actions.
11. Narrow to mobile width and confirm no horizontal overflow or unusable controls.

## External docs used

1. MDXEditor getting started: https://mdxeditor.dev/editor/docs/getting-started
2. Next.js local docs from `node_modules/next/dist/docs/`
