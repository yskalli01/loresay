import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
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
    createdFrom: sourceDateFilter(value("from")),
    createdTo: sourceDateFilter(value("to")),
    query: value("q") || undefined,
    status: sourceStatusFilter(value("status")),
    type: sourceTypeFilter(value("type")),
  };
}

function sourceDateFilter(value?: string): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : value;
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
  return [
    filters.collectionId,
    filters.createdFrom,
    filters.createdTo,
    filters.query,
    filters.status,
  ].filter(Boolean).length;
}

export function SourceFilterBar({
  clearHref = "/sources",
  collections,
  filters,
}: {
  clearHref?: string;
  collections: Array<{ collection_id: string; name: string }>;
  filters: SourceListFilters;
}) {
  const count = activeFilterCount(filters);
  const advancedFilterCount = [
    filters.collectionId,
    filters.createdFrom,
    filters.createdTo,
    filters.status,
  ].filter(Boolean).length;

  return (
    <form
      className="rounded-lg border border-border-subtle bg-surface p-3 shadow-card"
      method="get"
    >
      <div className="grid gap-2 lg:grid-cols-[minmax(16rem,1fr)_auto_auto_auto] lg:items-start">
        <label className="relative">
          <span className="sr-only">Search by title</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            className="h-11 w-full rounded-sm border border-border-subtle bg-surface-raised pl-9 pr-3 text-sm text-ink shadow-control transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 sm:h-10"
            defaultValue={filters.query}
            name="q"
            placeholder="Search sources by title"
          />
        </label>

        <details
          className="group relative rounded-md border border-border-subtle bg-surface-raised"
          open={advancedFilterCount > 0}
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-ink marker:hidden sm:min-h-10 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal
                className="h-4 w-4 text-muted"
                aria-hidden="true"
              />
              Filters
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
              {advancedFilterCount === 0 ? "" : advancedFilterCount}
              <ChevronDown
                className="h-4 w-4 transition group-open:rotate-180"
                aria-hidden="true"
              />
            </span>
          </summary>
          <fieldset className="grid gap-3 border-t border-border-subtle p-3 sm:grid-cols-2 lg:absolute lg:right-0 lg:top-[calc(100%+0.5rem)] lg:z-30 lg:w-[30rem] lg:rounded-lg lg:border lg:bg-surface lg:shadow-panel">
            <legend className="sr-only">More source filters</legend>
            <FilterSelect label="Status" name="status" value={filters.status}>
              <option value="">Any status</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </FilterSelect>
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
            <FilterDate
              label="Added from"
              name="from"
              value={filters.createdFrom}
            />
            <FilterDate label="Added to" name="to" value={filters.createdTo} />
          </fieldset>
        </details>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md px-3 text-sm font-semibold text-body transition hover:bg-surface-subtle sm:h-10"
          href={clearHref}
        >
          Clear{count > 0 ? ` (${count})` : ""}
        </Link>
        <Button icon={<Search className="h-4 w-4" />} type="submit">
          Apply
        </Button>
      </div>
    </form>
  );
}

function FilterDate({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-normal text-muted">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-sm border border-border-subtle bg-surface-raised px-3 text-sm text-ink shadow-control transition hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        defaultValue={value ?? ""}
        name={name}
        type="date"
      />
    </label>
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
      <span className="text-xs font-medium uppercase tracking-normal text-muted">
        {label}
      </span>
      <select
        className="h-11 w-full rounded-sm border border-border-subtle bg-surface-raised px-3 text-sm text-ink shadow-control transition hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        defaultValue={value ?? ""}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
