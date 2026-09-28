import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { SourceEditForm } from "@/presentation/app/source-edit-form";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { SourceLifecycleActions } from "@/presentation/app/source-lifecycle-actions";
import { SourceOrganizationForms } from "@/presentation/app/source-organization-forms";
import { AppShell } from "@/presentation/app/app-shell";
import { Badge, Card, CardBody, CardHeader } from "@/presentation/ui";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const user = await requireSessionUser();
  const { sourceId } = await params;
  const owner = { userId: user.id };
  const [detail, collections, tags] = await Promise.all([
    knowledgeRepository.getSourceDetail({ owner, sourceId }),
    knowledgeRepository.listCollections({ owner }),
    knowledgeRepository.listTags({ owner }),
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
      <div className="space-y-6">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-body hover:bg-surface-subtle"
          href="/sources"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to sources
        </Link>

        <section className="rounded-lg border border-border-subtle bg-surface p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge tone="accent">{source.type}</Badge>
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
              </div>
              <h1 className="mt-3 break-words text-3xl font-semibold tracking-normal text-ink">
                {source.title}
              </h1>
              <p className="mt-2 text-sm text-body">
                Updated {formatDisplayDate(source.updated_at)}
              </p>
            </div>
            {sourceUrl ? (
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-subtle px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
                href={sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open URL
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink">
                  Extracted content
                </h2>
                <p className="mt-1 text-sm text-body">
                  Active text currently available to retrieval.
                </p>
              </CardHeader>
              <CardBody>
                {detail.active_content_text ? (
                  <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-4 text-sm leading-6 text-body">
                    {detail.active_content_text}
                  </pre>
                ) : (
                  <p className="rounded-md bg-surface-subtle p-4 text-sm text-body">
                    No extracted text is active for this source yet.
                  </p>
                )}
              </CardBody>
            </Card>

            {source.type === "note" ? (
              <Card>
                <CardHeader>
                  <h2 className="text-base font-semibold text-ink">
                    Edit note
                  </h2>
                </CardHeader>
                <CardBody>
                  <SourceEditForm
                    body={detail.active_content_text ?? ""}
                    sourceId={source.source_id}
                    title={source.title}
                  />
                </CardBody>
              </Card>
            ) : null}
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink">
                  Organization
                </h2>
                <p className="mt-1 text-sm text-body">
                  Attach existing collections and tags to this source.
                </p>
              </CardHeader>
              <CardBody className="space-y-5">
                <PillGroup
                  empty="No collections attached"
                  items={detail.collections.map(
                    (collection) => collection.name,
                  )}
                />
                <PillGroup
                  accent
                  empty="No tags attached"
                  items={detail.tags.map((tag) => tag.name)}
                />
                <SourceOrganizationForms
                  collections={collections}
                  sourceId={source.source_id}
                  tags={tags}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink">Lifecycle</h2>
                <p className="mt-1 text-sm text-body">
                  Archive this source or retry failed processing.
                </p>
              </CardHeader>
              <CardBody>
                <SourceLifecycleActions
                  canRetry={source.status === "failed"}
                  sourceId={source.source_id}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-ink">
                  Source metadata
                </h2>
              </CardHeader>
              <CardBody className="space-y-3 text-sm">
                <MetadataRow label="Source ID" value={source.source_id} />
                <MetadataRow label="Fingerprint" value={source.fingerprint} />
                {Object.entries(source.metadata).map(([key, value]) => (
                  <MetadataRow key={key} label={key} value={String(value)} />
                ))}
              </CardBody>
            </Card>
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

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-subtle p-3">
      <dt className="text-xs font-medium uppercase text-muted">{label}</dt>
      <dd className="mt-1 break-words text-body">{value}</dd>
    </div>
  );
}
