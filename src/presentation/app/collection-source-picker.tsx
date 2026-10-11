"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { SourceSummaryDto } from "@/domain/knowledge";
import { Badge, Button, Input } from "@/presentation/ui";

export function CollectionSourcePicker({
  emptyMessage = "No sources are available to add.",
  label = "Sources",
  searchPlaceholder = "Search sources",
  sources,
}: {
  emptyMessage?: string;
  label?: string;
  searchPlaceholder?: string;
  sources: SourceSummaryDto[];
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const filteredSources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return sources;
    }

    return sources.filter(
      (source) =>
        source.title.toLowerCase().includes(normalizedQuery) ||
        source.type.toLowerCase().includes(normalizedQuery),
    );
  }, [query, sources]);
  const visibleIds = filteredSources.map((source) => source.source_id);
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((sourceId) => selectedIds.includes(sourceId));

  function toggleSource(sourceId: string) {
    setSelectedIds((current) =>
      current.includes(sourceId)
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId],
    );
  }

  function toggleVisible() {
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{label}</p>
          <p className="mt-1 text-xs text-body">
            {selectedIds.length === 0
              ? "No sources selected"
              : `${selectedIds.length} source${
                  selectedIds.length === 1 ? "" : "s"
                } selected`}
          </p>
        </div>
        {sources.length > 0 ? (
          <Button onClick={toggleVisible} size="sm" variant="ghost">
            {allVisibleSelected ? "Clear visible" : "Select visible"}
          </Button>
        ) : null}
      </div>

      {sources.length > 0 ? (
        <>
          <label className="relative block">
            <span className="sr-only">{searchPlaceholder}</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              type="search"
              value={query}
            />
          </label>

          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border-subtle bg-surface-raised p-2">
            {filteredSources.length > 0 ? (
              filteredSources.map((source) => (
                <label
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-subtle"
                  key={source.source_id}
                >
                  <input
                    checked={selectedIds.includes(source.source_id)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    name="sourceIds"
                    onChange={() => toggleSource(source.source_id)}
                    type="checkbox"
                    value={source.source_id}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
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
                </label>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-sm text-muted">
                No sources match this search.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-md bg-surface-subtle px-3 py-4 text-sm text-muted">
          {emptyMessage}
        </p>
      )}
    </fieldset>
  );
}
