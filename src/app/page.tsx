import {
  Bot,
  Database,
  FilePlus2,
  FolderKanban,
  Plus,
  StickyNote,
  Tags,
} from "lucide-react";
import Link from "next/link";

import type { CollectionSummaryDto } from "@/application/knowledge/repositories";
import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { MetricCard } from "@/presentation/app/knowledge-metrics";
import { PageHeader } from "@/presentation/app/page-header";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { Badge, Card, CardBody, CardHeader } from "@/presentation/ui";

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
  const profile = await knowledgeRepository.getProfile({ owner });
  const userName = profile?.displayName || user.email?.split("@")[0] || "there";
  const dashboard = await knowledgeRepository.getDashboardSummary({ owner });
  const recentSources = dashboard.sources.slice(0, recentActivityLimit);
  const topCollections = [...dashboard.collections]
    .sort(bySourceCountDesc)
    .slice(0, topCollectionsLimit);

  return (
    <AppShell activePath="/">
      <div className="space-y-4">
        <PageHeader
          badge="Dashboard"
          description="Overview of your knowledge, recent activity, and quick actions."
          title={`Good morning, ${userName}`}
          actions={
            <>
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border-subtle bg-surface px-3 text-sm font-medium text-ink shadow-control transition hover:bg-surface-subtle"
                href="/chat"
              >
                <Bot className="h-4 w-4 text-accent" aria-hidden="true" />
                Ask AI
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-on-accent shadow-control transition hover:bg-accent-strong active:scale-[0.98]"
                href="/new-source"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New source
              </Link>
            </>
          }
        />

        <section aria-labelledby="overview-metrics-title">
          <h2 className="sr-only" id="overview-metrics-title">
            Knowledge metrics
          </h2>
          <Card className="grid grid-flow-dense divide-y divide-border-subtle overflow-hidden sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4 [&>*:nth-child(3)]:sm:border-l-0 [&>*:nth-child(3)]:sm:border-t [&>*:nth-child(3)]:xl:border-l [&>*:nth-child(3)]:xl:border-t-0">
            <MetricCard
              detail="Total Sources"
              icon={<Database className="h-4 w-4" aria-hidden="true" />}
              label="Sources"
              value={dashboard.metrics.totalSources}
            />
            <MetricCard
              detail="Collections"
              icon={<FolderKanban className="h-4 w-4" aria-hidden="true" />}
              label="Collections"
              value={dashboard.collections.length}
            />
            <MetricCard
              detail="Note Sources"
              icon={<StickyNote className="h-4 w-4" aria-hidden="true" />}
              label="Notes"
              value={dashboard.metrics.noteSources}
            />
            <MetricCard
              detail="Not in a Collection"
              icon={<Tags className="h-4 w-4" aria-hidden="true" />}
              label="Unsorted"
              value={dashboard.metrics.unsortedSources}
            />
          </Card>
        </section>

        <div className="grid grid-flow-dense gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-8">
            <CardHeader>
              <h2 className="text-base font-bold text-ink">Recent Activity</h2>
            </CardHeader>
            <CardBody className="divide-y divide-border-subtle p-0">
              {recentSources.length > 0 ? (
                recentSources.map((source) => (
                  <Link
                    className="group flex items-center gap-3 px-4 py-3 transition hover:bg-surface-subtle"
                    href={`/sources/${source.source_id}`}
                    key={source.source_id}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-tint text-accent transition-transform duration-300 group-hover:scale-105">
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

          <Card className="lg:col-span-4">
            <CardHeader>
              <h2 className="text-base font-bold text-ink">Top Collections</h2>
            </CardHeader>
            <CardBody className="divide-y divide-border-subtle p-0">
              {topCollections.length > 0 ? (
                topCollections.map((collection) => (
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    key={collection.collection_id}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-tint text-accent">
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
