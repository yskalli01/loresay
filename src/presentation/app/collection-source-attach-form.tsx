"use client";

import { useActionState, useState } from "react";
import {
  ChevronDown,
  FileText,
  Link2,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";

import {
  addSourcesToCollectionAction,
  removeSourcesFromCollectionAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import type { SourceSummaryDto } from "@/domain/knowledge";
import { Badge, Button } from "@/presentation/ui";

import { CollectionSourcePicker } from "./collection-source-picker";

const initialState: NoteActionState = {};

export function CollectionSourceAttachForm({
  attachedSources,
  availableSources,
  collectionId,
}: {
  attachedSources: SourceSummaryDto[];
  availableSources: SourceSummaryDto[];
  collectionId: string;
}) {
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [addState, addAction, addPending] = useActionState(
    addSourcesToCollectionAction,
    initialState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeSourcesFromCollectionAction,
    initialState,
  );
  const attachedIds = new Set(
    attachedSources.map((source) => source.source_id),
  );
  const activeSelectedIds = selectedSourceIds.filter((sourceId) =>
    attachedIds.has(sourceId),
  );

  function toggleSource(sourceId: string) {
    setSelectedSourceIds((current) =>
      current.includes(sourceId)
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId],
    );
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">Manage sources</h2>
          <p className="mt-0.5 text-xs text-body">
            Select attached sources to remove, or add more from your library.
          </p>
        </div>
        <details className="group relative">
          <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-on-accent shadow-control transition hover:bg-accent-strong marker:hidden [&::-webkit-details-marker]:hidden">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add sources
            <ChevronDown
              className="h-4 w-4 transition group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <form
            action={addAction}
            className="mt-3 space-y-3 rounded-md border border-border-subtle bg-surface-raised p-3 sm:absolute sm:right-0 sm:top-10 sm:z-30 sm:w-[28rem] sm:shadow-panel"
          >
            <input name="collectionId" type="hidden" value={collectionId} />
            <CollectionSourcePicker
              emptyMessage="All available sources are already attached."
              label="Choose sources"
              searchPlaceholder="Search your library"
              sources={availableSources}
            />
            <div className="flex justify-end">
              <Button
                disabled={addPending || availableSources.length === 0}
                icon={<Plus className="h-4 w-4" />}
                size="sm"
                type="submit"
              >
                {addPending ? "Adding..." : "Add selected"}
              </Button>
            </div>
            <ActionMessage state={addState} />
          </form>
        </details>
      </div>

      <form action={removeAction} className="p-3">
        <input name="collectionId" type="hidden" value={collectionId} />
        {attachedSources.length > 0 ? (
          <div className="grid grid-flow-dense gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {attachedSources.map((source) => {
              const selected = activeSelectedIds.includes(source.source_id);
              const Icon =
                source.type === "note"
                  ? StickyNote
                  : source.type === "document"
                    ? FileText
                    : Link2;

              return (
                <label
                  className={
                    selected
                      ? "flex cursor-pointer items-center gap-3 rounded-md border border-accent/40 bg-accent-tint p-3 ring-1 ring-accent/20"
                      : "flex cursor-pointer items-center gap-3 rounded-md border border-border-subtle bg-surface-raised p-3 transition hover:border-border hover:bg-surface-subtle"
                  }
                  key={source.source_id}
                >
                  <input
                    checked={selected}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    name="sourceIds"
                    onChange={() => toggleSource(source.source_id)}
                    type="checkbox"
                    value={source.source_id}
                  />
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface text-accent shadow-control">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {source.title}
                    </span>
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
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="px-1 py-2 text-sm text-muted">
            No sources are attached yet.
          </p>
        )}

        {activeSelectedIds.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-body">
              {activeSelectedIds.length} selected. Sources remain in your
              library.
            </p>
            <Button
              disabled={removePending}
              icon={<Trash2 className="h-4 w-4" />}
              size="sm"
              type="submit"
              variant="danger"
            >
              {removePending ? "Removing..." : "Remove selected"}
            </Button>
          </div>
        ) : null}
        <ActionMessage state={removeState} />
      </form>
    </section>
  );
}

function ActionMessage({ state }: { state: NoteActionState }) {
  if (state.error) {
    return (
      <p className="rounded-md border border-error/20 bg-error-tint px-3 py-2 text-sm font-medium text-error-strong">
        {state.error}
      </p>
    );
  }

  if (state.message) {
    return (
      <p className="rounded-md border border-success/20 bg-success-tint px-3 py-2 text-sm font-medium text-success-strong">
        {state.message}
      </p>
    );
  }

  return null;
}
