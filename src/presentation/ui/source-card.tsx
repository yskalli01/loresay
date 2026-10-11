import { Clock3, FileText } from "lucide-react";
import type { ReactNode } from "react";

import { formatDisplayDate } from "@/presentation/lib/format-date";

import { Badge } from "./badge";
import { Card } from "./card";

export type SourceStatus =
  "draft" | "processing" | "ready" | "failed" | "deleted";

export type SourceCardProps = {
  title: string;
  type: string;
  status: SourceStatus;
  updatedAt: Date | string;
  children?: ReactNode;
  collections?: string[];
};

const statusTone: Record<
  SourceStatus,
  "archived" | "completed" | "failed" | "neutral" | "processing"
> = {
  deleted: "archived",
  draft: "neutral",
  failed: "failed",
  processing: "processing",
  ready: "completed",
};

function typeTone(type: string): "document" | "note" | "url" | "neutral" {
  if (type === "document") {
    return "document";
  }

  if (type === "note") {
    return "note";
  }

  if (type === "url") {
    return "url";
  }

  return "neutral";
}

export function SourceCard({
  children,
  collections = [],
  status,
  title,
  type,
  updatedAt,
}: SourceCardProps) {
  const machineDate =
    typeof updatedAt === "string" ? updatedAt : updatedAt.toISOString();

  return (
    <Card className="group p-5 hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent ring-1 ring-accent/15 transition group-hover:bg-accent-soft">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold leading-6 text-ink">
              {title}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={typeTone(type)}>{type}</Badge>
              <Badge tone={statusTone[status]}>{status}</Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-md bg-surface-subtle px-3 py-2 text-sm text-body ring-1 ring-border-subtle">
        <Clock3 className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <time dateTime={machineDate}>{formatDisplayDate(updatedAt)}</time>
      </div>
      {collections.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {collections.map((collection) => (
            <Badge key={collection} tone="collection">
              {collection}
            </Badge>
          ))}
        </div>
      ) : null}
      {children}
    </Card>
  );
}
