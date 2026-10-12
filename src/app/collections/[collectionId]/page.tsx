import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder } from "lucide-react";

import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { CollectionDetailActions } from "@/presentation/app/collection-detail-actions";
import { CollectionSourceAttachForm } from "@/presentation/app/collection-source-attach-form";
import { SourceSummaryGrid } from "@/presentation/app/source-summary-grid";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { Badge, Card, CardBody } from "@/presentation/ui";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const { collectionId } = await params;
  const [detail, allSources] = await Promise.all([
    knowledgeRepository.getCollectionDetail({ collectionId, owner }),
    knowledgeRepository.listKnowledgeSources({ limit: 100, owner }),
  ]);

  if (!detail) {
    notFound();
  }

  const attachedSourceIds = new Set(
    detail.sources.map((source) => source.source_id),
  );
  const availableSources = allSources.items.filter(
    (source) => !attachedSourceIds.has(source.source_id),
  );

  return (
    <AppShell activePath="/collections">
      <div className="space-y-4">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-body transition hover:text-accent"
          href="/collections"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Collections
        </Link>

        <Card className="overflow-visible">
          <CardBody className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent-tint text-accent ring-1 ring-accent/15">
              {detail.collection.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={
                    detail.collection.image_url.startsWith("http")
                      ? detail.collection.image_url
                      : `/api/collections/${detail.collection.collection_id}/image`
                  }
                />
              ) : (
                <Folder className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Badge tone="collection">Collection</Badge>
                  <h1 className="mt-2 break-words text-2xl font-bold tracking-normal text-ink">
                    {detail.collection.name}
                  </h1>
                  <p className="mt-1 text-xs font-medium text-muted">
                    {detail.collection.source_count} sources · Updated{" "}
                    {formatDisplayDate(detail.collection.updated_at)}
                  </p>
                </div>
                <CollectionDetailActions
                  collection={detail.collection}
                  sources={allSources.items}
                />
              </div>
              {detail.collection.description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-body">
                  {detail.collection.description}
                </p>
              ) : null}
            </div>
          </CardBody>
        </Card>

        <CollectionSourceAttachForm
          attachedSources={detail.sources}
          availableSources={availableSources}
          collectionId={detail.collection.collection_id}
        />

        <section
          aria-labelledby="collection-sources-title"
          className="space-y-3"
        >
          <div>
            <h2
              className="text-base font-bold text-ink"
              id="collection-sources-title"
            >
              Sources in this collection
            </h2>
            <p className="mt-1 text-sm text-body">
              Review the notes, documents, and URLs grouped here.
            </p>
          </div>
          <SourceSummaryGrid
            emptyDescription="Add a source to this collection to see it here."
            emptyTitle="No sources in this collection yet"
            layout="wide"
            sources={detail.sources}
          />
        </section>
      </div>
    </AppShell>
  );
}
