import Link from "next/link";

import type { SourceSummaryDto } from "@/domain/knowledge";
import { SourceEditForm } from "@/presentation/app/source-edit-form";
import { EmptyState, SourceCard } from "@/presentation/ui";

type SourceSummaryGridProps = {
  emptyDescription: string;
  emptyTitle: string;
  editableNotes?: boolean;
  sources: SourceSummaryDto[];
};

export function SourceSummaryGrid({
  editableNotes = false,
  emptyDescription,
  emptyTitle,
  sources,
}: SourceSummaryGridProps) {
  if (sources.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
      {sources.map((source) => (
        <SourceCard
          key={source.source_id}
          status={source.status === "purged" ? "deleted" : source.status}
          title={source.title}
          type={source.type}
          updatedAt={source.updated_at}
        >
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-10 items-center rounded-md border border-border-subtle bg-surface-raised px-3 text-sm font-medium text-ink shadow-sm transition hover:border-border hover:bg-surface-subtle"
              href={`/sources/${source.source_id}`}
            >
              Source details
            </Link>
          </div>
          {editableNotes && source.type === "note" ? (
            <SourceEditForm
              body={source.active_content_text ?? ""}
              sourceId={source.source_id}
              title={source.title}
            />
          ) : null}
        </SourceCard>
      ))}
    </div>
  );
}
