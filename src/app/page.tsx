import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Clock3,
  Database,
  Inbox,
  Link2,
  StickyNote,
} from "lucide-react";
import Link from "next/link";

import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { MetricCard, StatusCount } from "@/presentation/app/knowledge-metrics";
import { PageHeader } from "@/presentation/app/page-header";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { SourceSummaryGrid } from "@/presentation/app/source-summary-grid";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Table,
  TableCell,
  TableHeaderCell,
} from "@/presentation/ui";

import { signOut } from "./auth/actions";

const workspaceLinks = [
  {
    description: "Capture and revise your saved text notes.",
    href: "/notes",
    icon: StickyNote,
    label: "Notes",
  },
  {
    description: "Add URLs and supported text documents.",
    href: "/ingestion",
    icon: Link2,
    label: "Ingestion",
  },
  {
    description: "Ask grounded questions with collection and tag scope.",
    href: "/chat",
    icon: Bot,
    label: "Chat with AI",
  },
  {
    description: "Browse, filter, organize, and inspect every source.",
    href: "/sources",
    icon: Database,
    label: "Sources",
  },
];

export default async function Home() {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const [dashboard, recentSources] = await Promise.all([
    knowledgeRepository.getDashboardSummary({ owner }),
    knowledgeRepository.listKnowledgeSources({ limit: 24, owner }),
  ]);
  const sources = recentSources.items;
  const readyCount = sources.filter(
    (source) => source.status === "ready",
  ).length;
  const failedCount = sources.filter(
    (source) => source.status === "failed",
  ).length;

  return (
    <AppShell activePath="/">
      <div className="space-y-6">
        <PageHeader
          actions={
            <form action={signOut}>
              <Button variant="secondary" type="submit">
                Sign out
              </Button>
            </form>
          }
          badge="Knowledge workspace"
          description="Your private knowledge base is now organized by task, so capture, ingestion, organization, and chat each have room to breathe."
          title="Overview"
        />

        <section aria-labelledby="overview-metrics-title">
          <h2 className="sr-only" id="overview-metrics-title">
            Knowledge metrics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              detail="Visible active sources"
              label="Sources"
              value={sources.length}
            />
            <MetricCard
              detail="Eligible for retrieval"
              label="Ready"
              value={readyCount}
            />
            <MetricCard
              detail="Saved organization groups"
              label="Collections"
              value={dashboard.collections.length}
            />
            <MetricCard
              detail="Need attention or retry"
              label="Failed"
              value={failedCount}
            />
          </div>
        </section>

        <section aria-labelledby="workspace-pages-title" className="space-y-4">
          <div>
            <h2
              className="text-xl font-semibold text-ink"
              id="workspace-pages-title"
            >
              Main pages
            </h2>
            <p className="mt-1 text-sm text-body">
              Each feature has its own page in the sidebar, with this overview
              reserved for status and recent work.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {workspaceLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className="group rounded-md border border-border-subtle bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-panel"
                  href={item.href}
                  key={item.href}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent-tint text-accent ring-1 ring-accent/10 transition group-hover:bg-accent-soft">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-ink">
                      {item.label}
                    </span>
                    <ArrowRight
                      className="h-4 w-4 text-accent transition group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-body">
                    {item.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-labelledby="recent-sources-title" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  className="text-xl font-semibold text-ink"
                  id="recent-sources-title"
                >
                  Recent sources
                </h2>
                <p className="mt-1 text-sm text-body">
                  A quick look at the latest notes, documents, and URLs.
                </p>
              </div>
              <Link
                className="inline-flex min-h-11 items-center rounded-md border border-border-subtle bg-surface-raised px-4 text-sm font-medium text-ink shadow-sm transition hover:border-border hover:bg-surface-subtle"
                href="/sources"
              >
                View all sources
              </Link>
            </div>
            <SourceSummaryGrid
              emptyDescription="Add a note, upload a document, or ingest a URL to start building your knowledge base."
              emptyTitle="No sources yet"
              sources={dashboard.sources}
            />
          </section>

          <aside className="space-y-6" aria-label="Overview side panels">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink">
                  Ingestion status
                </h2>
                <p className="mt-1 text-sm text-body">
                  Processing health across saved sources.
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

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-ink">
                      Recent activity
                    </h2>
                    <p className="mt-1 text-sm text-body">
                      Latest source updates across the workspace.
                    </p>
                  </div>
                  <Badge>read only</Badge>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <Table>
                  <thead>
                    <tr>
                      <TableHeaderCell>Source</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.sources.map((source) => (
                      <tr key={source.source_id}>
                        <TableCell className="font-medium text-ink">
                          <Link
                            className="hover:text-accent"
                            href={`/sources/${source.source_id}`}
                          >
                            {source.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            tone={
                              source.status === "ready"
                                ? "success"
                                : source.status === "failed"
                                  ? "error"
                                  : "warning"
                            }
                          >
                            {source.status}
                          </Badge>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
