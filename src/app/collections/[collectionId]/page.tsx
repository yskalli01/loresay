import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder, ImageIcon } from "lucide-react";

import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
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
      <div className="space-y-5">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-body transition hover:text-accent"
          href="/collections"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Collections
        </Link>

        <Card>
          <CardBody className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent-tint text-accent ring-1 ring-accent/15">
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
                <Folder className="h-9 w-9" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <Badge tone="collection">Collection</Badge>
              <h1 className="mt-3 break-words text-2xl font-bold tracking-normal text-ink">
                {detail.collection.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="accent">
                  {detail.collection.source_count} sources
                </Badge>
                {detail.collection.image_url ? (
                  <Badge tone="neutral">
                    <ImageIcon className="h-3 w-3" aria-hidden="true" />
                    Image saved
                  </Badge>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-body">
                Updated {formatDisplayDate(detail.collection.updated_at)}.
              </p>
              {detail.collection.description ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-body">
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
