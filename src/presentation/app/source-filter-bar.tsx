import { Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { SourceListFilters } from "@/application/knowledge/repositories";
import { Button } from "@/presentation/ui";

export function parseSourceFilters(
  searchParams: Record<string, string | string[] | undefined>,
): SourceListFilters {
  const value = (key: string) => {
    const current = searchParams[key];
    return Array.isArray(current) ? current[0] : current;
  };

  return {
    collectionId: value("collection") || undefined,
    query: value("q") || undefined,
    status: sourceStatusFilter(value("status")),
    tagId: value("tag") || undefined,
    type: sourceTypeFilter(value("type")),
  };
}

function sourceTypeFilter(value?: string): SourceListFilters["type"] {
  return value === "note" || value === "document" || value === "url"
    ? value
    : undefined;
}

function sourceStatusFilter(value?: string): SourceListFilters["status"] {
  return value === "draft" ||
    value === "processing" ||
    value === "ready" ||
    value === "failed"
    ? value
    : undefined;
}

function activeFilterCount(filters: SourceListFilters) {
  return Object.values(filters).filter(Boolean).length;
}

export function SourceFilterBar({
  clearHref = "/sources",
  collections,
  filters,
  tags,
}: {
  clearHref?: string;
  collections: Array<{ collection_id: string; name: string }>;
  filters: SourceListFilters;
  tags: Array<{ tag_id: string; name: string }>;
}) {
  const count = activeFilterCount(filters);

  return (
    <form
      className="rounded-md border border-border-subtle bg-surface shadow-card"
      method="get"
    >
      <div className="border-b border-border-subtle px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">Filter sources</h3>
            <p className="mt-1 text-sm leading-6 text-body">
              Search first, then narrow by source type, processing status, or
              organization labels.
            </p>
          </div>
          <p className="rounded-full border border-border-subtle bg-surface-subtle px-3 py-1 text-xs font-medium text-body">
            {count === 0
              ? "No filters active"
              : `${count} active filter${count === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <label className="space-y-2">
          <span className="text-sm font-medium text-ink">Search by title</span>
          <input
            className="h-12 w-full rounded-md border border-border-subtle bg-surface-raised px-3 text-base text-ink shadow-sm transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            defaultValue={filters.query}
            name="q"
            placeholder="Example: project brief, design notes, API docs"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-ink">Source state</legend>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <FilterSelect label="Type" name="type" value={filters.type}>
              <option value="">Any type</option>
              <option value="note">Note</option>
              <option value="document">Document</option>
              <option value="url">URL</option>
            </FilterSelect>
            <FilterSelect label="Status" name="status" value={filters.status}>
              <option value="">Any status</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </FilterSelect>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-ink">Organization</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <FilterSelect
              label="Collection"
              name="collection"
              value={filters.collectionId}
            >
              <option value="">Any collection</option>
              {collections.map((collection) => (
                <option
                  key={collection.collection_id}
                  value={collection.collection_id}
                >
                  {collection.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Tag" name="tag" value={filters.tagId}>
              <option value="">Any tag</option>
              {tags.map((tag) => (
                <option key={tag.tag_id} value={tag.tag_id}>
                  {tag.name}
                </option>
              ))}
            </FilterSelect>
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md px-3 text-sm font-medium text-body transition hover:bg-surface-subtle"
            href={clearHref}
          >
            Clear filters
          </Link>
          <Button icon={<Search className="h-4 w-4" />} type="submit">
            Apply filters
          </Button>
        </div>
      </div>
    </form>
  );
}

function FilterSelect({
  children,
  label,
  name,
  value,
}: {
  children: ReactNode;
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <select
        className="h-11 w-full rounded-md border border-border-subtle bg-surface-raised px-3 text-sm text-ink shadow-sm transition hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        defaultValue={value ?? ""}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
