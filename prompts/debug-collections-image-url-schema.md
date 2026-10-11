# Debug collections page schema issue

## Goal
Fix the issue displayed on the collections page after the collection image feature was added.

## Skills read
- Project `AGENTS.md`.
- `/debug` skill from `C:\Users\yskal\.agents\skills\debug\SKILL.md`.

## Symptom captured
- A normal unauthenticated request to `http://localhost:3000/collections` redirects to the auth page, so it does not show the logged in issue.
- The logged in page path loads collection data through `src/app/collections/page.tsx`.
- The collection repository now selects `collections.imageUrl`, which maps to the live database column `collections.image_url`.

## Evidence
- `pnpm run db:verify` passes, but that script only checks table, RLS, policy, index, and constraint counts.
- A direct live schema query shows the `collections` table has only `id`, `user_id`, `name`, `created_at`, and `updated_at`.
- The live table is missing `image_url`, which explains the displayed page error once an authenticated request reaches the collection query.

## Root cause
The code and Drizzle schema expect `collections.image_url`, but the live database has not applied `drizzle/0002_collection_images.sql`.

## Decisions and assumptions
- Use the existing migration rather than adding a fallback query, because the feature requires the image field for create, edit, list, detail, and export behavior.
- Improve the local live schema verification script so future checks confirm the required `collections.image_url` column exists.
- Do not change UI design or add any new collection features.

## Files expected to touch
- `scripts/verify-live-schema.mjs`

## Database operation expected
- Run `pnpm run db:migrate` to apply `drizzle/0002_collection_images.sql` to the configured database.

## Requirements
- Apply the existing migration to add `collections.image_url` and its length constraint.
- Verify the live schema contains `collections.image_url`.
- Extend `scripts/verify-live-schema.mjs` so it fails when this column is missing.
- Keep the fix minimal and scoped to the proven root cause.

## Security considerations
- Keep RLS unchanged.
- Do not expose database credentials.
- Do not loosen owner scoped queries or policies.

## Acceptance criteria
- The live `collections` table includes `image_url`.
- `pnpm run db:verify` reports the column check and passes.
- `http://localhost:3000/collections` still returns `200`.
- Existing quality checks continue to pass.

## Checks to run
1. `pnpm run db:migrate`
2. Direct schema query for `collections.image_url`
3. `pnpm run db:verify`
4. `pnpm run quality:deadline`
5. `Invoke-WebRequest http://localhost:3000/collections`

## Manual test steps
1. Open `http://localhost:3000/collections` while signed in.
2. Confirm the collections page renders instead of the database error.
3. Create or edit a collection with an optional image URL.
4. Confirm the collection remains visible on the list page.