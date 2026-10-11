import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { NewSourceTabs } from "@/presentation/app/new-source-tabs";
import { PageHeader } from "@/presentation/app/page-header";
import { SourceSummaryGrid } from "@/presentation/app/source-summary-grid";

export default async function NewSourcePage() {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const recentSources = await knowledgeRepository.listKnowledgeSources({
    limit: 12,
    owner,
  });
  const sources = [...recentSources.items]
    .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
    .slice(0, 12);

  return (
    <AppShell activePath="/">
      <div className="space-y-5">
        <PageHeader
          badge="New Source"
          description="Write a note, upload a document, or save a web page."
          title="New Source"
        />

        <NewSourceTabs />

        <section aria-labelledby="recent-sources-title" className="space-y-3">
          <div>
            <h2
              className="text-base font-bold text-ink"
              id="recent-sources-title"
            >
              Recently added
            </h2>
            <p className="mt-1 text-sm text-body">
              Review what you saved recently, or open a source for details and
              organization.
            </p>
          </div>
          <SourceSummaryGrid
            emptyDescription="Save your first note, upload a document, or add a URL to see it here."
            emptyTitle="No sources yet"
            layout="wide"
            sources={sources}
          />
        </section>
      </div>
    </AppShell>
  );
}
