import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export type SourcePaginationProps = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  /** Number of page buttons visible at once. */
  visiblePages?: number;
  searchParams?: Record<string, string | string[] | undefined>;
};

function hrefFor({
  basePath,
  page,
  searchParams,
}: {
  basePath: string;
  page: number;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "page" || value === undefined) {
      continue;
    }

    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized) {
      params.set(key, normalized);
    }
  }

  params.set("page", String(page));

  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}

export function SourcePagination({
  basePath,
  page,
  pageSize,
  total,
  visiblePages = 5,
  searchParams,
}: SourcePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total <= pageSize) {
    return null;
  }

  const half = Math.floor(visiblePages / 2);
  let firstPage = Math.max(1, page - half);
  const lastPage = Math.min(totalPages, firstPage + visiblePages - 1);
  firstPage = Math.max(1, lastPage - visiblePages + 1);

  const pages: number[] = [];
  for (let index = firstPage; index <= lastPage; index += 1) {
    pages.push(index);
  }

  const linkClass = (active: boolean) =>
    active
      ? "inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-accent px-3 text-xs font-semibold text-on-accent shadow-control"
      : "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border-subtle bg-surface-raised px-3 text-xs font-semibold text-body hover:bg-surface-subtle";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-surface p-4 shadow-card"
    >
      {page > 1 ? (
        <Link
          aria-label="Go to previous page"
          className={linkClass(false)}
          href={hrefFor({ basePath, page: page - 1, searchParams })}
          rel="prev"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}

      {pages.map((pageNumber) => {
        const active = pageNumber === page;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            aria-label={`Go to page ${pageNumber}`}
            className={linkClass(active)}
            href={hrefFor({ basePath, page: pageNumber, searchParams })}
            key={pageNumber}
          >
            {pageNumber}
          </Link>
        );
      })}

      {page < totalPages ? (
        <Link
          aria-label="Go to next page"
          className={linkClass(false)}
          href={hrefFor({ basePath, page: page + 1, searchParams })}
          rel="next"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
