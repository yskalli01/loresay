import { Bot, Database, FilePlus2, Plus } from "lucide-react";
import Link from "next/link";

import type { CollectionSummaryDto } from "@/application/knowledge/repositories";
import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { MetricCard } from "@/presentation/app/knowledge-metrics";
import { PageHeader } from "@/presentation/app/page-header";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { Badge, Card, CardBody, CardHeader } from "@/presentation/ui";

const quickActions = [
  { href: "/new-source", icon: Plus, label: "New Source" },
  { href: "/chat", icon: Bot, label: "Start Chat" },
];

const recentActivityLimit = 5;
const topCollectionsLimit = 5;

function bySourceCountDesc(
  left: CollectionSummaryDto,
  right: CollectionSummaryDto,
) {
  return (
    right.source_count - left.source_count ||
    left.name.localeCompare(right.name)
  );
}

export default async function Home() {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const dashboard = await knowledgeRepository.getDashboardSummary({ owner });
  const recentSources = dashboard.sources.slice(0, recentActivityLimit);
  const topCollections = [...dashboard.collections]
    .sort(bySourceCountDesc)
    .slice(0, topCollectionsLimit);

  return (
    <AppShell activePath="/">
      <div className="space-y-5">
        <PageHeader
          badge="Dashboard"
          description="Overview of your knowledge, recent activity, and quick actions."
          title="Good morning, Alex"
        />

        <section aria-labelledby="quick-add-title" className="space-y-3">
          <h2 className="text-sm font-bold text-ink" id="quick-add-title">
            Quick Add
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface text-sm font-semibold text-accent-strong shadow-card transition hover:-translate-y-0.5 hover:border-accent/25 hover:bg-accent-tint"
                  href={action.href}
                  key={action.label}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="overview-metrics-title">
          <h2 className="sr-only" id="overview-metrics-title">
            Knowledge metrics
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              detail="Total Sources"
              label="Sources"
              value={dashboard.metrics.totalSources}
            />
            <MetricCard
              detail="Collections"
              label="Collections"
              value={dashboard.collections.length}
            />
            <MetricCard
              detail="Note Sources"
              label="Notes"
              value={dashboard.metrics.noteSources}
            />
            <MetricCard
              detail="Not in a Collection"
              label="Unsorted"
              value={dashboard.metrics.unsortedSources}
            />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <h2 className="text-base font-bold text-ink">Recent Activity</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {recentSources.length > 0 ? (
                recentSources.map((source) => (
                  <Link
                    className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface-raised p-3 transition hover:bg-surface-subtle"
                    href={`/sources/${source.source_id}`}
                    key={source.source_id}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-tint text-accent">
                      <Database className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {source.title}
                      </span>
                      <span className="text-xs text-muted">
                        {formatDisplayDate(source.updated_at)}
                      </span>
                    </span>
                    <Badge
                      tone={
                        source.status === "ready" ? "completed" : "processing"
                      }
                    >
                      {source.status}
                    </Badge>
                  </Link>
                ))
              ) : (
                <p className="rounded-md bg-surface-subtle p-4 text-sm text-body">
                  No activity yet. Add a note, upload a file, or save a URL.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-bold text-ink">Top Collections</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {topCollections.length > 0 ? (
                topCollections.map((collection) => (
                  <div
                    className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface-raised p-3"
                    key={collection.collection_id}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-tint text-accent">
                      <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {collection.name}
                      </p>
                      <p className="text-xs text-muted">
                        {collection.source_count} sources
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-surface-subtle p-4 text-sm text-body">
                  Collections appear here after you create them.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
