# Replace Dashboard Metrics

## Goal

Replace the dashboard `Ready Sources` and `Messages` cards with accurate `Notes` and `Unsorted` cards. Keep the existing four card layout and all unrelated dashboard styling and behavior unchanged.

## Skills Read

1. `/develop`, for the focused UI and repository implementation flow.
2. `supabase`, for owner scoped database access and Supabase security rules.
3. `supabase-postgres-best-practices`, for the aggregate query and foreign key index.

## Code Inspected

1. `AGENTS.md`, including the prompt approval gate, Clean Architecture boundaries, verification commands, and Next.js version warning.
2. `src/app/page.tsx`, which currently loads a capped source page, calculates ready sources from those rows, and hard codes `320` messages.
3. `src/application/knowledge/repositories.ts`, which defines the `getDashboardSummary` contract.
4. `src/infrastructure/db/knowledge-repository.ts`, which already owner scopes dashboard sources, collections, chat, and ingestion data.
5. `src/infrastructure/db/schema.ts`, where `collection_sources` has a primary key ordered as `collection_id, source_id` but no index beginning with `source_id`.
6. `src/app/page.test.tsx` and `src/infrastructure/db/schema.test.ts`, which provide the current route and schema test patterns.
7. `drizzle/meta/_journal.json` and the current SQL migrations, whose next migration number is `0004`.
8. `design/ui.png` and `design.md`, which establish the four card dashboard layout.
9. The installed Next.js 16 data fetching guide, which confirms that the existing async Server Component may query through the repository directly.
10. Supabase query optimization guidance, which recommends indexing foreign key columns used for joins and filters.

## Decisions And Assumptions

1. The metric order is `Sources`, `Collections`, `Notes`, then `Unsorted`.
2. The detail text is `Total Sources`, `Collections`, `Note Sources`, and `Not in a Collection`.
3. `Sources` counts every active source owned by the signed in user.
4. `Notes` counts every active owned source whose type is `note`. Draft, processing, ready, and failed notes all count.
5. `Unsorted` counts every active owned source with no row in `collection_sources`.
6. A source assigned to one or more collections is not unsorted.
7. Active means `knowledge_sources.deleted_at is null`. Archived and deleted sources do not count.
8. Metric cards remain informational and are not links.
9. No public HTTP API, table, column, RLS policy, or client side data request changes are needed.
10. Preserve the current uncommitted work. Do not revert or rewrite unrelated changes.

## Files Expected To Change

1. `src/app/page.tsx`
2. `src/app/page.test.tsx`
3. `src/application/knowledge/repositories.ts`
4. `src/application/knowledge/use-cases.test.ts`
5. `src/application/knowledge/thin-loop.test.ts`
6. `src/infrastructure/db/knowledge-repository.ts`
7. `src/infrastructure/db/schema.ts`
8. `src/infrastructure/db/schema.test.ts`
9. `drizzle/0004_collection_sources_source_index.sql`
10. `drizzle/meta/_journal.json`

Only touch another file when a compile error or an established test contract requires it.

## Requirements

1. Extend the `getDashboardSummary` return contract with:

```ts
metrics: {
  totalSources: number;
  noteSources: number;
  unsortedSources: number;
}
```

2. In `getDashboardSummary`, run one aggregate query over `knowledge_sources` for the signed in owner. Apply `user_id = owner.userId` and `deleted_at is null` before calculating all three counts.
3. Calculate `totalSources` with `count(*)`.
4. Calculate `noteSources` with a filtered count where source type is `note`.
5. Calculate `unsortedSources` with a filtered count whose condition is `not exists` for a `collection_sources` row matching the source id.
6. Use Drizzle SQL templates and bound values. Do not interpolate user input into raw SQL.
7. Return integer values and default missing aggregate results to zero.
8. Keep the existing recent source limit of six inside `getDashboardSummary`.
9. Remove the second `listKnowledgeSources({ limit: 24 })` dashboard request. Render the `Sources`, `Notes`, and `Unsorted` values from `dashboard.metrics`.
10. Render the collection value from the existing owner scoped `dashboard.collections.length`.
11. Remove the local `readyCount` calculation and the hard coded `320` value.
12. Keep the current card grid classes, card component, order of surrounding sections, spacing, typography, and responsive behavior.
13. Add `index("collection_sources_source_idx").on(table.sourceId)` to the Drizzle schema.
14. Add the next migration with this database change only:

```sql
CREATE INDEX "collection_sources_source_idx" ON "collection_sources" USING btree ("source_id");
```

15. Record migration `0004_collection_sources_source_index` in the existing Drizzle journal without altering prior entries.
16. Update every typed repository mock with a `metrics` object.

## Security Considerations

1. Derive ownership only from the authenticated server session and the existing `OwnerContext`.
2. Keep the owner predicate in the aggregate query. Never count another user's sources or collection membership.
3. Exclude archived and deleted sources with `deleted_at is null`.
4. Do not add a view, database function, security definer function, or service role access.
5. Do not expose source titles, content, or collection membership to the client beyond the three integer counts already rendered by the Server Component.

## Acceptance Criteria

1. The dashboard shows four cards in this order: `Sources`, `Collections`, `Notes`, `Unsorted`.
2. Their detail text is exactly `Total Sources`, `Collections`, `Note Sources`, and `Not in a Collection`.
3. `Ready Sources`, `Messages`, `Chat Messages`, and `320` are absent from the dashboard markup.
4. Counts are exact even when the user has more than 24 sources.
5. An active note in a collection increases `Sources` and `Notes`, but not `Unsorted`.
6. An active document or URL without a collection increases `Sources` and `Unsorted`, but not `Notes`.
7. An active failed note without a collection increases all three source metrics.
8. Archived and deleted sources do not increase any metric.
9. A user with no active sources sees zero for `Sources`, `Notes`, and `Unsorted`.
10. Existing collections, recent activity, quick actions, chat, and source pages retain their behavior.
11. The new source id index exists in both the Drizzle schema and migration history.

## Tests To Add Or Update

1. Update the dashboard repository mock with distinct metric values so each rendered card can be identified.
2. Add dashboard route assertions for all four labels, details, and values.
3. Assert that the removed ready and message copy and the hard coded `320` do not render.
4. Add an empty dashboard render case whose three source metrics are zero.
5. Update application test repository doubles to satisfy the extended contract.
6. Extend the schema test to assert that `collection_sources_source_idx` begins with `sourceId`.
7. Inspect the aggregate query in the focused repository verification to confirm owner scope, active source filtering, note filtering, and `not exists` collection membership semantics. If the current test harness cannot execute Postgres repository queries, verify these four cases manually against the local database and record the limitation in the final report.

## Checks To Run

1. `pnpm run lint`
2. `pnpm run typecheck`
3. `pnpm run test:core`
4. `pnpm run test`
5. `pnpm run quality:deadline`
6. Run `/test` for focused behavior coverage after implementation.
7. Run `/check verify` for the dashboard because this is a visible UI change.

## Manual Test Steps

1. Start the app with `AI_PROVIDER=stub pnpm run dev` and sign in.
2. Open `/` and confirm the four cards read `Sources`, `Collections`, `Notes`, and `Unsorted` in that order.
3. Confirm the card detail text matches the acceptance criteria and the old ready and message wording is absent.
4. Create a note without adding it to a collection. Confirm `Sources`, `Notes`, and `Unsorted` each increase by one after returning to the dashboard.
5. Add that note to a collection. Confirm `Unsorted` decreases by one while `Sources` and `Notes` stay unchanged.
6. Add a document or URL without a collection. Confirm `Sources` and `Unsorted` increase while `Notes` stays unchanged.
7. Archive one of those sources. Confirm it no longer contributes to the metrics.
8. Check the dashboard at desktop and mobile widths. Confirm the existing card layout and spacing remain intact.
