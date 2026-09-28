import { AlertTriangle, Clock3, Inbox } from "lucide-react";

import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { DocumentUploadForm } from "@/presentation/app/document-upload-form";
import { StatusCount } from "@/presentation/app/knowledge-metrics";
import { PageHeader } from "@/presentation/app/page-header";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { SourceSummaryGrid } from "@/presentation/app/source-summary-grid";
import { UrlIngestionForm } from "@/presentation/app/url-ingestion-form";
import { Card, CardBody, CardHeader } from "@/presentation/ui";

export default async function IngestionPage() {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const [dashboard, urlSources, documentSources] = await Promise.all([
    knowledgeRepository.getDashboardSummary({ owner }),
    knowledgeRepository.listKnowledgeSources({
      filters: { type: "url" },
      limit: 12,
      owner,
    }),
    knowledgeRepository.listKnowledgeSources({
      filters: { type: "document" },
      limit: 12,
      owner,
    }),
  ]);
  const ingestedSources = [...urlSources.items, ...documentSources.items]
    .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
    .slice(0, 12);

  return (
    <AppShell activePath="/ingestion">
      <div className="space-y-6">
        <PageHeader
          badge="Ingestion"
          description="Bring in web pages and supported text documents without mixing capture controls into the overview."
          title="Ingestion"
        />

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-6" aria-label="Ingestion controls">
            <UrlIngestionForm />
            <DocumentUploadForm />
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink">
                  Processing status
                </h2>
                <p className="mt-1 text-sm text-body">
                  Current queue health across ingested sources.
                </p>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <StatusCount
                    icon={<Inbox className="h-4 w-4" />}
                    label="Queued"
                    value={dashboard.ingestion.queuedCount}
                  />
                  <StatusCount
                    icon={<Clock3 className="h-4 w-4" />}
                    label="Processing"
                    value={dashboard.ingestion.processingCount}
                  />
                  <StatusCount
                    icon={<AlertTriangle className="h-4 w-4" />}
                    label="Failed"
                    value={dashboard.ingestion.failedCount}
                  />
                </div>
                <p className="rounded-md bg-surface-subtle p-3 text-sm leading-6 text-body">
                  {dashboard.ingestion.latestActivity
                    ? `Last processing activity ${formatDisplayDate(dashboard.ingestion.latestActivity)}`
                    : "No processing activity yet"}
                </p>
              </CardBody>
            </Card>
          </aside>

          <section
            aria-labelledby="recent-ingestion-title"
            className="space-y-4"
          >
            <div>
              <h2
                className="text-xl font-semibold text-ink"
                id="recent-ingestion-title"
              >
                Recent ingested sources
              </h2>
              <p className="mt-1 text-sm text-body">
                Review URLs and documents after they enter the processing loop.
              </p>
            </div>
            <SourceSummaryGrid
              emptyDescription="Add a URL or upload a text document to see ingestion results here."
              emptyTitle="No ingested sources yet"
              sources={ingestedSources}
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
