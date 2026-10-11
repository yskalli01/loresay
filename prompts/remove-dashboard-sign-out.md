# Remove dashboard sign out button

## Goal
Remove the visible `Sign out` button from the dashboard page header.

## Skills read
I read the local `/develop` skill because this is implementation work.

## Code inspected
I inspected:

- `AGENTS.md`
- `src/app/page.tsx`
- `src/presentation/app/app-shell.tsx`
- `src/app/page.test.tsx`

## Decision
The request says dashboard UI, so this change removes the `Sign out` button from the dashboard page header only.

The account menu sign out action in the shared app header stays in place. That keeps users able to sign out from the account menu while removing the extra dashboard button.

## Files expected to change
- `src/app/page.tsx`

Potentially:

- `src/app/page.test.tsx`, only if the current assertions directly depend on the removed dashboard button.

## Requirements
- Remove the dashboard page header `Sign out` form and button.
- Remove the unused `signOut` import from the dashboard page.
- Leave the account menu sign out button unchanged.
- Do not change layout, colors, copy, or unrelated account behavior.

## Security considerations
This removes one UI entry point only.

The server action remains available for the account menu.

## Acceptance criteria
- The dashboard header no longer displays a `Sign out` button.
- The account menu still displays its `Sign out` action.
- TypeScript and lint pass.
- Core tests pass.

## Checks to run
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test:core`

Or the combined project command:

- `pnpm run quality:deadline`

## Manual test steps
1. Open `http://localhost:3000/`.
2. Confirm the dashboard header has no `Sign out` button.
3. Open the user avatar menu in the header.
4. Confirm the account menu still has `Sign out`.
