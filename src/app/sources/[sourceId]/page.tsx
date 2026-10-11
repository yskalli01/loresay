import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { SourceDetailTabs } from "@/presentation/app/source-detail-tabs";
import { SourceEditDialog } from "@/presentation/app/source-edit-dialog";
import { SourceSettingsPanel } from "@/presentation/app/privacy-lifecycle-panel";
import { SourceOrganizationForms } from "@/presentation/app/source-organization-forms";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { Badge, Card, CardBody, CardHeader } from "@/presentation/ui";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const user = await requireSessionUser();
  const { sourceId } = await params;
  const owner = { userId: user.id };
  const [detail, collections, citations] = await Promise.all([
    knowledgeRepository.getSourceDetail({ owner, sourceId }),
    knowledgeRepository.listCollections({ owner }),
    knowledgeRepository.listSourceCitations({ owner, sourceId }),
  ]);

  if (!detail) {
    notFound();
  }

  const source = detail.source;
  const sourceUrl =
    source.type === "url" && typeof source.metadata.canonical_url === "string"
      ? source.metadata.canonical_url
      : null;

  return (
    <AppShell activePath="/sources">
      <div className="space-y-5">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-body hover:bg-surface-subtle"
          href="/sources"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to sources
        </Link>

        <section className="rounded-lg border border-border-subtle bg-surface p-5 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h1 className="break-words text-xl font-bold tracking-normal text-ink">
                  {source.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Badge
                    tone={
                      source.type === "note"
                        ? "note"
                        : source.type === "document"
                          ? "document"
                          : "url"
                    }
                  >
                    {source.type}
                  </Badge>
                  <Badge
                    tone={
                      source.status === "ready"
                        ? "completed"
                        : source.status === "failed"
                          ? "failed"
                          : "processing"
                    }
                  >
                    {source.status}
                  </Badge>
                  <span>Updated {formatDisplayDate(source.updated_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {sourceUrl ? (
                <a
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-subtle px-3 text-sm font-semibold text-ink hover:bg-surface-subtle"
                  href={sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open URL
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
              {source.type === "note" ||
              source.type === "document" ||
              source.type === "url" ? (
                <SourceEditDialog
                  body={detail.active_content_text ?? ""}
                  sourceId={source.source_id}
                  title={source.title}
                  type={source.type}
                  url={sourceUrl}
                />
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <SourceDetailTabs
              activeContentText={detail.active_content_text}
              citations={citations}
            />
          </div>

          <aside className="space-y-5">
            <Card>
              <CardHeader>
                <h2 className="text-base font-bold text-ink">Organization</h2>
              </CardHeader>
              <CardBody className="space-y-5">
                <PillGroup
                  empty="No collections attached"
                  items={detail.collections.map(
                    (collection) => collection.name,
                  )}
                />
                <SourceOrganizationForms
                  collections={collections}
                  sourceId={source.source_id}
                />
              </CardBody>
            </Card>

            <SourceSettingsPanel
              canRetry={source.status === "failed" || source.status === "ready"}
              sourceId={source.source_id}
              sourceTitle={source.title}
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function PillGroup({
  accent = false,
  empty,
  items,
}: {
  accent?: boolean;
  empty: string;
  items: string[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} tone={accent ? "accent" : "neutral"}>
          {item}
        </Badge>
      ))}
    </div>
  );
}
