import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { OrganizationPanel } from "@/presentation/app/organization-panel";
import { PageHeader } from "@/presentation/app/page-header";
import {
  parseSourceFilters,
  SourceFilterBar,
} from "@/presentation/app/source-filter-bar";
import { SourceSummaryGrid } from "@/presentation/app/source-summary-grid";

export default async function SourcesPage(props?: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const searchParams = props?.searchParams ? await props.searchParams : {};
  const filters = parseSourceFilters(searchParams);
  const [dashboard, sourceList] = await Promise.all([
    knowledgeRepository.getDashboardSummary({ owner }),
    knowledgeRepository.listKnowledgeSources({
      filters,
      limit: 24,
      owner,
    }),
  ]);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <AppShell activePath="/sources">
      <div className="space-y-6">
        <PageHeader
          badge="Source manager"
          description="Browse saved knowledge, filter it by status or organization, and open source detail pages for metadata, extracted text, lifecycle controls, collections, and tags."
          title="Sources"
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-labelledby="sources-title" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink" id="sources-title">
                Source library
              </h2>
              <p className="mt-1 text-sm text-body">
                Filter your private knowledge by source type, status,
                collection, tag, or title.
              </p>
            </div>

            <SourceFilterBar
              collections={dashboard.collections}
              filters={filters}
              tags={dashboard.tags}
            />

            <SourceSummaryGrid
              emptyDescription={
                hasFilters
                  ? "No saved sources match those filters."
                  : "Save your first note, document, or URL to make it available for grounded answers."
              }
              emptyTitle={hasFilters ? "No matching sources" : "No sources yet"}
              sources={sourceList.items}
            />
          </section>

          <aside className="space-y-6" aria-label="Source organization">
            <OrganizationPanel
              collections={dashboard.collections}
              tags={dashboard.tags}
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
