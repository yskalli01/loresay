"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import type { SearchFilters } from "./search-filters";
import { timeOptions, typeOptions } from "./search-filters";

export type SearchFilterCollections = Array<{
  collection_id: string;
  name: string;
}>;

const collectionSelectId = "search-filter-collection";
const timeSelectId = "search-filter-time";
const typeSelectId = "search-filter-type";

export function SearchQueryForm({
  collections,
  filters,
  initialQuery,
}: {
  collections: SearchFilterCollections;
  filters: SearchFilters;
  initialQuery: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const pendingParams = useRef(new Map<string, string | null>());
  const currentQuery = searchParams.get("q") ?? "";

  const navigate = useCallback(
    (changes: Array<[name: string, value: string | null]>) => {
      for (const [name, value] of changes) {
        pendingParams.current.set(name, value);
      }

      const params = new URLSearchParams(searchParams.toString());

      for (const [name, value] of pendingParams.current) {
        if (value === null) {
          params.delete(name);
        } else {
          params.set(name, value);
        }
      }

      const nextUrl = params.size > 0 ? `${pathname}?${params}` : pathname;
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const replaceQuery = useCallback(
    (nextQuery: string) => {
      navigate([["q", nextQuery || null]]);
    },
    [navigate],
  );

  useEffect(() => {
    for (const [name, value] of pendingParams.current) {
      if (searchParams.get(name) === value) {
        pendingParams.current.delete(name);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const nextQuery = query.trim();

    if (nextQuery === currentQuery) {
      return;
    }

    const timeout = window.setTimeout(() => {
      replaceQuery(nextQuery);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [currentQuery, query, replaceQuery]);

  function clearSearch() {
    setQuery("");
    replaceQuery("");
  }

  function applyFilter(name: "collection" | "time" | "type", value: string) {
    navigate([
      [name, value || null],
      ["page", null],
    ]);
  }

  return (
    <form
      className="space-y-3"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        replaceQuery(query.trim());
      }}
    >
      <label className="relative block">
        <span className="sr-only">Search all content</span>
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          className="h-12 w-full rounded-md border border-border-subtle bg-surface pl-10 pr-10 text-sm text-ink shadow-control placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          name="q"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sources..."
          value={query}
        />
        <button
          aria-label="Clear search"
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-surface-subtle hover:text-ink disabled:pointer-events-none disabled:opacity-30"
          disabled={!query && !currentQuery && !isPending}
          onClick={clearSearch}
          type="button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <FilterSelect
          id={typeSelectId}
          label="Filter by type"
          name="type"
          onValueChange={(value) => applyFilter("type", value)}
          value={filters.type ?? ""}
        >
          {typeOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id={collectionSelectId}
          label="Filter by collection"
          name="collection"
          onValueChange={(value) => applyFilter("collection", value)}
          value={filters.collectionId ?? ""}
        >
          <option value="">All Collections</option>
          {collections.map((collection) => (
            <option
              key={collection.collection_id}
              value={collection.collection_id}
            >
              {collection.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id={timeSelectId}
          label="Filter by time"
          name="time"
          onValueChange={(value) => applyFilter("time", value)}
          value={filters.time ?? ""}
        >
          {timeOptions.map((option) => (
            <option key={option.value || "any"} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </div>
    </form>
  );
}

function FilterSelect({
  children,
  id,
  label,
  name,
  onValueChange,
  value,
}: {
  children: ReactNode;
  id: string;
  label: string;
  name: string;
  onValueChange: (value: string) => void;
  value: string;
}) {
  return (
    <div>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        className="h-11 w-full rounded-md border border-border-subtle bg-surface px-3 text-sm text-ink shadow-control transition hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        id={id}
        name={name}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </div>
  );
}
