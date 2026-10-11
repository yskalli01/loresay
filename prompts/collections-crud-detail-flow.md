# Collections CRUD And Detail Flow

## Goal

Build a full collections management feature.

Users should be able to create, read, update, and delete collections. They should be able to select multiple collections and delete them together. They should be able to search collections by name, filter and sort collections by collection fields, add sources to collections, and open a collection detail page that shows the sources inside that collection.

## Skills Read

I read AGENTS.md.

I read /develop from C:\Users\yskal\.agents\skills\develop\SKILL.md.

I read .agents/skills/supabase/SKILL.md.

I read .agents/skills/supabase-postgres-best-practices/SKILL.md.

I read these Supabase Postgres references:

schema-data-types.md

schema-constraints.md

query-composite-indexes.md

security-rls-basics.md

## Current Docs Checked

I tried to open https://supabase.com/changelog.md. The fetch failed because the server returned markdown with an unsupported content type for the web tool.

I searched the Supabase changelog and RLS docs. The visible current guidance still emphasizes RLS on exposed tables, authenticated role policies, and testing access behavior.

I read Next.js local docs in node_modules for page props and forms:

node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md

node_modules/next/dist/docs/01-app/03-api-reference/02-components/form.md

## Code Inspected

I inspected src/app/collections/page.tsx.

I inspected src/app/actions/knowledge.ts.

I inspected src/application/knowledge/repositories.ts.

I inspected src/application/knowledge/use-cases.ts.

I inspected src/application/knowledge/use-cases.test.ts.

I inspected src/infrastructure/db/schema.ts.

I inspected src/infrastructure/db/schema.test.ts.

I inspected src/infrastructure/db/knowledge-repository.ts.

I inspected src/app/sources/page.tsx.

I inspected src/presentation/app/source-filter-bar.tsx.

I inspected src/presentation/ui/button.tsx.

I inspected src/presentation/ui/input.tsx.

I inspected src/presentation/ui/card.tsx.

I inspected src/app/page.test.tsx.

## Decisions And Assumptions

This is both UI and logical work.

Collection images will be stored as an optional image URL string on the collection record, not as an uploaded file in Supabase Storage.

The database column will be nullable text, named image_url in SQL and imageUrl in TypeScript.

Only HTTP and HTTPS image URLs will be accepted when an image URL is provided.

The existing owner scoped RLS policy on collections remains the policy model. The new column does not need a new RLS policy.

Collection filtering will use fields already available or added in this slice: name search, source count, image presence, created date, updated date, and sort order.

Deleting a collection should delete only the collection and its collection_sources links through cascade. It must not delete sources.

Bulk delete should owner scope every requested collection.

The new collection button should open a modal on the collections page, not navigate to a new page.

The same modal can be used for editing a collection.

Adding a source to a collection should be available from the collection create or edit modal when sources exist, and from the collection detail page.

Error messages should appear inline in the modal or action area when a server action returns an error.

## Files Expected To Touch

src/infrastructure/db/schema.ts

drizzle/0002_collection_images.sql

drizzle/meta/_journal.json

Possibly drizzle/meta/0002_snapshot.json if the project expects generated snapshots for migrations.

src/application/knowledge/repositories.ts

src/application/knowledge/use-cases.ts

src/application/knowledge/use-cases.test.ts

src/infrastructure/db/knowledge-repository.ts

src/infrastructure/db/schema.test.ts

src/app/actions/knowledge.ts

src/app/collections/page.tsx

src/app/collections/[collectionId]/page.tsx

src/presentation/app/collection-manager.tsx

src/presentation/app/collection-source-manager.tsx or similar small component

src/app/page.test.tsx

Possibly src/presentation/ui/index.ts if a reused UI export is needed.

## Requirements

Add optional image URL support to collections.

List collections with collection id, name, image URL, source count, created at, and updated at.

Create a collection from a modal with fields for name, image URL, and optional source attachment.

Update a collection from the same modal pattern.

Delete one collection from the list.

Select multiple collections in the list and delete them in one action.

Search collections by name through the query string.

Filter collections by whether they have sources.

Filter collections by whether they have an image URL.

Sort collections by name, newest, recently updated, or source count.

Clicking a collection should navigate to /collections/[collectionId].

The collection detail page should show collection information and all sources assigned to that collection.

The detail page should include a way to add an owned source to that collection.

All forms should show inline success or error messages.

All writes must require the signed in session user.

All repository writes must be owner scoped.

Keep the design aligned with design.md and existing app pages.

The UI must be keyboard accessible, including modal open and close controls, checkboxes, forms, and action buttons.

## Security Considerations

Do not expose service role keys or secret keys to client code.

Do not alter broad auth behavior.

Do not bypass RLS with security definer functions.

Do not add public storage uploads in this slice.

Collection image URLs are user supplied strings. Validate that non empty values are HTTP or HTTPS URLs before saving.

Deleting a collection must not delete sources.

Adding a source to a collection must verify the source and collection share the same owner.

Bulk delete must delete only collections owned by the current user.

## Acceptance Criteria

The collections page shows a searchable and filterable collection manager.

New Collection opens a modal instead of navigating away.

The modal includes collection name, collection image URL, and source attachment controls.

A collection can be created and errors appear inline when creation fails.

A collection can be edited and errors appear inline when editing fails.

A collection can be deleted and errors appear inline when deletion fails.

Multiple selected collections can be deleted together.

Collection search by name changes the rendered collection list.

Collection filters based on source count and image URL affect the rendered list.

A collection card or row links to its detail page.

The collection detail page lists only sources in that collection.

The collection detail page can attach another source to the collection.

Tests cover collection validation and route rendering.

## Checks To Run

Run pnpm run test:core.

Run pnpm run lint.

Run pnpm run typecheck.

Run pnpm run test.

Run pnpm run quality:deadline if the earlier checks pass.

Run local HTTP checks for /collections and at least one /collections/[collectionId] route while the dev server is running.

## Manual Test Steps

1. Open http://localhost:3000/collections.

2. Click New Collection.

3. Confirm a modal opens on the same page.

4. Submit an empty name and confirm an inline error appears.

5. Create a collection with a name and optional image URL.

6. Edit the collection name or image URL from the collection list.

7. Select two collections and delete them together.

8. Use search to find a collection by name.

9. Use filters for source count and image presence.

10. Click a collection.

11. Confirm the detail page shows sources in that collection.

12. Add a source to the collection from the detail page.

13. Confirm errors appear inline if an action fails.
