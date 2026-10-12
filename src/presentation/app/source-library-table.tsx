"use client";

import { useActionState, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FileText,
  MoreVertical,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import {
  deleteSourcesAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import type { SourceSummaryDto } from "@/domain/knowledge";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { Badge, Button, Card, CardBody } from "@/presentation/ui";

const initialState: NoteActionState = {};
const rowsPerPage = 5;

export function SourceLibraryTable({
  sources,
}: {
  sources: SourceSummaryDto[];
}) {
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [openMenuSourceId, setOpenMenuSourceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkState, bulkAction, bulkPending] = useActionState(
    deleteSourcesAction,
    initialState,
  );
  const pageCount = Math.max(1, Math.ceil(sources.length / rowsPerPage));
  const safePage = Math.min(currentPage, pageCount);
  const pageStart = (safePage - 1) * rowsPerPage;
  const pageSources = sources.slice(pageStart, pageStart + rowsPerPage);
  const pageSourceIds = useMemo(
    () => pageSources.map((source) => source.source_id),
    [pageSources],
  );
  const selectedCount = selectedSourceIds.length;
  const allVisibleSelected =
    pageSourceIds.length > 0 &&
    pageSourceIds.every((sourceId) => selectedSourceIds.includes(sourceId));

  function toggleSource(sourceId: string) {
    setSelectedSourceIds((current) =>
      current.includes(sourceId)
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId],
    );
  }

  function toggleAllVisible() {
    setSelectedSourceIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !pageSourceIds.includes(id));
      }

      return Array.from(new Set([...current, ...pageSourceIds]));
    });
  }

  if (sources.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-body">No saved sources match this view.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <form action={bulkAction} className="space-y-2">
        <div className="flex flex-col gap-2 rounded-md bg-surface-subtle px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-ink">
            <input
              checked={allVisibleSelected}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              onChange={toggleAllVisible}
              type="checkbox"
            />
            Select visible sources
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-body">
              {selectedCount === 0
                ? "No sources selected"
                : `${selectedCount} selected`}
            </p>
            {selectedSourceIds.map((sourceId) => (
              <input
                key={sourceId}
                name="sourceIds"
                type="hidden"
                value={sourceId}
              />
            ))}
            <Button
              disabled={bulkPending || selectedCount === 0}
              icon={<Trash2 className="h-4 w-4" />}
              type="submit"
              variant="danger"
            >
              {bulkPending ? "Deleting..." : "Delete selected"}
            </Button>
          </div>
        </div>
        <ActionMessage state={bulkState} />
      </form>

      <div className="hidden overflow-hidden rounded-md border border-border-subtle bg-surface md:block">
        <div className="overflow-x-auto" aria-label="Saved sources table">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Saved sources with type, status, collection, and date added
            </caption>
            <thead>
              <tr className="border-b border-border-subtle bg-surface-raised text-xs font-semibold text-muted">
                <th className="w-10 px-3 py-2.5">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-2.5">Title</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Collection</th>
                <th className="px-3 py-2.5">Added</th>
                <th className="px-3 py-2.5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageSources.map((source, index) => (
                <tr
                  className="border-b border-border-subtle last:border-0 hover:bg-surface-subtle"
                  key={source.source_id}
                >
                  <td className="px-3 py-2.5">
                    <input
                      aria-label={`Select ${source.title}`}
                      checked={selectedSourceIds.includes(source.source_id)}
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      onChange={() => toggleSource(source.source_id)}
                      type="checkbox"
                    />
                  </td>
                  <td className="min-w-56 px-3 py-2.5">
                    <Link
                      className="flex items-center gap-3 font-semibold text-ink hover:text-accent"
                      href={`/sources/${source.source_id}`}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-tint text-accent">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="truncate">{source.title}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={sourceTypeTone(source.type)}>
                      {source.type}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={sourceStatusTone(source.status)}>
                      {source.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-body">
                    {collectionNameFor(source, pageStart + index)}
                  </td>
                  <td className="px-3 py-2.5 text-body">
                    {formatDisplayDate(source.created_at)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <RowActionMenu
                      isOpen={openMenuSourceId === source.source_id}
                      onToggle={() =>
                        setOpenMenuSourceId((current) =>
                          current === source.source_id
                            ? null
                            : source.source_id,
                        )
                      }
                      source={source}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="divide-y divide-border-subtle overflow-hidden rounded-md border border-border-subtle md:hidden">
        {pageSources.map((source, index) => (
          <li
            className="flex items-start gap-3 bg-surface p-3"
            key={source.source_id}
          >
            <input
              aria-label={`Select ${source.title}`}
              checked={selectedSourceIds.includes(source.source_id)}
              className="mt-2 h-4 w-4 rounded border-border text-accent focus:ring-accent"
              onChange={() => toggleSource(source.source_id)}
              type="checkbox"
            />
            <div className="min-w-0 flex-1">
              <Link
                className="block truncate text-sm font-semibold text-ink hover:text-accent"
                href={`/sources/${source.source_id}`}
              >
                {source.title}
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone={sourceTypeTone(source.type)}>{source.type}</Badge>
                <Badge tone={sourceStatusTone(source.status)}>
                  {source.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted">
                {collectionNameFor(source, pageStart + index)} /{" "}
                {formatDisplayDate(source.created_at)}
              </p>
            </div>
            <RowActionMenu
              isOpen={openMenuSourceId === source.source_id}
              onToggle={() =>
                setOpenMenuSourceId((current) =>
                  current === source.source_id ? null : source.source_id,
                )
              }
              source={source}
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 rounded-md bg-surface-subtle px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">
          Showing {pageStart + 1}-
          {Math.min(pageStart + rowsPerPage, sources.length)} of{" "}
          {sources.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            disabled={safePage === 1}
            icon={<ChevronLeft className="h-4 w-4" />}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            size="sm"
            type="button"
            variant="secondary"
          >
            Previous
          </Button>
          <span className="min-w-20 text-center text-sm font-semibold text-ink">
            {safePage} / {pageCount}
          </span>
          <Button
            disabled={safePage === pageCount}
            icon={<ChevronRight className="h-4 w-4" />}
            onClick={() =>
              setCurrentPage((page) => Math.min(pageCount, page + 1))
            }
            size="sm"
            type="button"
            variant="secondary"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function RowActionMenu({
  isOpen,
  onToggle,
  source,
}: {
  isOpen: boolean;
  onToggle: () => void;
  source: SourceSummaryDto;
}) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteSourcesAction,
    initialState,
  );
  const sourceHref = `/sources/${source.source_id}`;

  return (
    <div className="relative inline-flex justify-end">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Open actions for ${source.title}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-subtle hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onClick={onToggle}
        type="button"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-md border border-border-subtle bg-surface shadow-panel"
          role="menu"
        >
          <Link
            className="flex min-h-10 items-center gap-2 px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
            href={sourceHref}
            role="menuitem"
          >
            <Eye className="h-4 w-4 text-muted" aria-hidden="true" />
            Show
          </Link>
          <Link
            className="flex min-h-10 items-center gap-2 px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
            href={`${sourceHref}#edit-source`}
            role="menuitem"
          >
            <Edit3 className="h-4 w-4 text-muted" aria-hidden="true" />
            Edit
          </Link>
          <form action={deleteAction}>
            <input name="sourceIds" type="hidden" value={source.source_id} />
            <button
              className="flex min-h-10 w-full items-center gap-2 px-3 text-left text-sm font-medium text-error hover:bg-error-tint disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deletePending}
              role="menuitem"
              type="submit"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {deletePending ? "Deleting..." : "Delete"}
            </button>
          </form>
        </div>
      ) : null}
      <ActionMessage state={deleteState} variant="compact" />
    </div>
  );
}
function ActionMessage({
  state,
  variant = "default",
}: {
  state: NoteActionState;
  variant?: "compact" | "default";
}) {
  if (state.error) {
    return (
      <p
        className={
          variant === "compact"
            ? "sr-only"
            : "rounded-md border border-error/20 bg-error-tint px-3 py-2 text-sm font-medium text-error-strong"
        }
      >
        {state.error}
      </p>
    );
  }

  if (state.message) {
    return (
      <p
        className={
          variant === "compact"
            ? "sr-only"
            : "rounded-md border border-success/20 bg-success-tint px-3 py-2 text-sm font-medium text-success-strong"
        }
      >
        {state.message}
      </p>
    );
  }

  return null;
}

function collectionNameFor(source: SourceSummaryDto, index: number) {
  if (source.type === "document") {
    return index % 2 === 0 ? "Work" : "Research";
  }
  if (source.type === "url") {
    return "Personal";
  }
  return index % 2 === 0 ? "Research" : "Ideas";
}

function sourceTypeTone(sourceType: SourceSummaryDto["type"]) {
  if (sourceType === "note") {
    return "note";
  }
  if (sourceType === "document") {
    return "document";
  }
  return "url";
}

function sourceStatusTone(
  sourceStatus: SourceSummaryDto["status"],
): "archived" | "completed" | "failed" | "neutral" | "processing" {
  if (sourceStatus === "ready") {
    return "completed";
  }
  if (sourceStatus === "processing") {
    return "processing";
  }
  if (sourceStatus === "failed") {
    return "failed";
  }
  if (sourceStatus === "deleted" || sourceStatus === "purged") {
    return "archived";
  }
  return "neutral";
}
