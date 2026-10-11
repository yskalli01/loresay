# Implement design system from design image

## Goal

Refresh the app UI foundation so it matches `design/design-system.png`.

The reference image is the source of truth for the visual system. It shows the AI Personal Knowledge Base brand, token palette, typography, icon style, buttons, fields, search bars, dropdowns, toggles, radio buttons, badges, alerts, cards, chat messages, and navigation states.

This is a design system implementation pass, not a new product feature.

## Skills read

1. Root `AGENTS.md`
2. `/develop` skill
3. `/develop` UI guide
4. `/develop` image source guide
5. `/develop` implementation guide
6. `/develop` accessibility and token checklist

## Code and project context inspected

1. `design.md`
2. `design/design-system.png`
3. `package.json`
4. `docs/scope/scope.md`
5. `docs/specs/0003-design-system-ui-foundation.md`
6. `src/app/globals.css`
7. `src/app/layout.tsx`
8. `src/app/page.tsx`
9. `src/presentation/app/app-shell.tsx`
10. `src/presentation/app/page-header.tsx`
11. `src/presentation/app/knowledge-metrics.tsx`
12. `src/presentation/ui/button.tsx`
13. `src/presentation/ui/badge.tsx`
14. `src/presentation/ui/input.tsx`
15. `src/presentation/ui/card.tsx`
16. `src/presentation/ui/source-card.tsx`
17. `src/presentation/ui/states.tsx`
18. `src/presentation/ui/table.tsx`
19. `src/presentation/ui/index.ts`
20. `src/presentation/ui/ui.test.tsx`
21. `src/app/page.test.tsx`
22. `src/app/globals.test.ts`
23. Next.js docs for layouts and pages
24. Next.js docs for server and client components
25. Next.js docs for CSS
26. Next.js docs for fonts

## Decisions and assumptions

1. The accepted UI foundation spec `0003` still governs the architecture.
2. The new image updates the visual language and token values.
3. No new architecture decision is needed.
4. No Supabase, Drizzle, OpenAI, or data model work is needed.
5. The implementation should stay in `src/presentation` and `src/app/globals.css`.
6. Existing server components should remain server components unless interactivity requires a client boundary.
7. The app should keep Tailwind CSS and the local primitive set.
8. The Inter typeface in the image will be loaded through `next/font/google` unless the project already has a local Inter asset.
9. The brand icon can be implemented as a local reusable mark using CSS and simple HTML, with lucide icons still used for product controls.
10. Existing user changes in `AGENTS.md` and the untracked `design/` folder must be preserved.

## Expected files to touch

1. `design.md`
2. `src/app/globals.css`
3. `src/app/layout.tsx`
4. `src/presentation/app/app-shell.tsx`
5. `src/presentation/app/page-header.tsx`
6. `src/presentation/app/knowledge-metrics.tsx`
7. `src/presentation/ui/button.tsx`
8. `src/presentation/ui/badge.tsx`
9. `src/presentation/ui/input.tsx`
10. `src/presentation/ui/card.tsx`
11. `src/presentation/ui/source-card.tsx`
12. `src/presentation/ui/states.tsx`
13. `src/presentation/ui/table.tsx`
14. `src/presentation/ui/ui.test.tsx`
15. `src/app/globals.test.ts`
16. Possibly `src/presentation/ui/brand-mark.tsx`
17. Possibly `src/presentation/ui/select.tsx`
18. Possibly `src/presentation/ui/toggle.tsx`
19. Possibly `src/presentation/ui/radio.tsx`

## Requirements

1. Extract visible values from the image into CSS tokens.
2. Keep `accent` as the canonical name for the primary purple accent.
3. Update `design.md` so it records the image based character and points to CSS for token values.
4. Match the image palette closely.
5. Use `#6366F1`, `#4F46E5`, `#A5B4FC`, the neutral scale, semantic colors, and surface colors shown in the image.
6. Update the typography tokens to Inter with the visible size scale.
7. Keep light mode as the shipped mode.
8. Preserve token names where possible so existing pages keep working.
9. Add new token names only when the image needs values the current token set cannot express.
10. Update shared UI primitives so existing pages inherit the new system.
11. Buttons must support primary, secondary, tertiary, and danger styling with default, hover, pressed, and disabled states.
12. Inputs must support default, focused, invalid, disabled, helper text, and icon layouts.
13. Badges must support collection, note, document, URL, processing, completed, failed, and archived tones.
14. Alerts and states must match the image language for success, info, warning, and error.
15. Cards must match the tighter radius, border, soft shadow, and icon tile treatment in the image.
16. Navigation must match the reference sidebar language with brand mark, active row, icon states, and collapsed state ready styling where useful.
17. Search and filter controls should use existing input primitives where possible.
18. Keep every control keyboard reachable, labelled, and at least 44 pixels tall on mobile.
19. Do not invent a new component library.
20. Do not change business logic, repository calls, auth, database code, or API behavior.

## Security considerations

1. Do not expose private user data in presentation placeholders or tests.
2. Do not move server only data access into client components.
3. Do not add new network calls beyond font loading through the Next.js font system.
4. Keep presentation primitives free of domain, infrastructure, Supabase, OpenAI, and database imports.
5. Preserve auth enforcement on protected routes.

## Acceptance criteria

1. CSS tokens in `src/app/globals.css` reflect the visible design system image.
2. `design.md` describes the new image based design system and points to CSS for token values.
3. The app shell and dashboard render with the new brand, purple accent, softened surfaces, and tighter control style.
4. Shared primitives expose the visual states shown in the image.
5. Existing app pages continue to render with the shared primitives.
6. Focus states remain visible and accessible.
7. Existing route and component tests pass after updates.
8. No Clean Architecture boundary violation is introduced.
9. The design image is not modified.

## Checks to run

1. `pnpm run lint`
2. `pnpm run typecheck`
3. `pnpm run test:core`
4. `pnpm run quality:deadline`
5. `pnpm run quality` before final delivery if time and dependency state allow.

## Manual test steps

1. Start the app with `AI_PROVIDER=stub pnpm run dev`.
2. Sign in or use the existing local auth path.
3. Visit `/`.
4. Confirm the shell shows the new AI Personal Knowledge Base brand treatment.
5. Confirm sidebar active, hover, and focus states match the image language.
6. Confirm dashboard cards, badges, icon tiles, buttons, tables, and status panels use the new tokens.
7. Visit `/notes`.
8. Confirm form fields, labels, helper text, invalid states, and action buttons match the new system.
9. Visit `/ingestion`.
10. Confirm URL and document controls use the new input and card styling.
11. Visit `/chat`.
12. Confirm chat message surfaces, retrieval selectors, and primary action styling match the system.
13. Visit `/sources`.
14. Confirm filters, source cards, organization labels, archived source states, and lifecycle actions use the new system.
15. Narrow the viewport to mobile width.
16. Confirm the top bar and sheet navigation remain usable with no overflow.
17. Use keyboard Tab and Enter through the shell and main controls.
18. Confirm focus is visible and activation works.

## Notes

The current git status shows `AGENTS.md` modified and `design/` untracked. Treat both as user provided context and do not revert them.
