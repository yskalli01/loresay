import { FileText } from "lucide-react";
import Link from "next/link";

import type { SourceSummaryDto } from "@/domain/knowledge";
import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { PageHeader } from "@/presentation/app/page-header";
import { SourcePagination } from "@/presentation/app/source-pagination";
import { SearchQueryForm } from "@/presentation/app/search-query-form";
import {
  buildSearchSourceFilters,
  parseSearchFilters,
} from "@/presentation/app/search-filters";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { Badge } from "@/presentation/ui";

const pageSize = 5;

export default async function SearchPage(props?: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireSessionUser();
  const searchParams = props?.searchParams ? await props.searchParams : {};
  const parsed = parseSearchFilters(searchParams);
  const query = parsed.query ?? "";
  const requestedPage = Number.parseInt(valueOf(searchParams.page) ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const owner = { userId: user.id };
  const [sourceList, collections] = await Promise.all([
    knowledgeRepository.listKnowledgeSources({
      filters: buildSearchSourceFilters(parsed),
      limit: pageSize,
      offset: (page - 1) * pageSize,
      owner,
    }),
    knowledgeRepository.listCollections({ owner }),
  ]);
  const totalPages = Math.max(1, Math.ceil(sourceList.total / pageSize));
  const start = (page - 1) * pageSize;

  return (
    <AppShell activePath="/search">
      <div className="space-y-4">
        <PageHeader
          description="Search across all your saved content."
          title="Search"
        />

        <SearchQueryForm
          key={query}
          collections={collections}
          filters={parsed}
          initialQuery={query}
        />

        <section
          className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card"
          aria-label="Search results"
        >
          <p className="border-b border-border-subtle px-4 py-3 text-sm font-semibold text-ink">
            {sourceList.total} results found
            {sourceList.total > sourceList.items.length
              ? ` · showing ${start + 1}-${start + sourceList.items.length}`
              : ""}
          </p>
          <div className="divide-y divide-border-subtle">
            {sourceList.items.map((source) => (
              <SearchResult key={source.source_id} source={source} />
            ))}
          </div>
          <div className="border-t border-border-subtle p-3">
            <SourcePagination
              basePath="/search"
              page={Math.min(page, totalPages)}
              pageSize={pageSize}
              searchParams={searchParams}
              total={sourceList.total}
              visiblePages={3}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function SearchResult({ source }: { source: SourceSummaryDto }) {
  return (
    <article className="group flex items-start gap-3 px-4 py-3 transition hover:bg-surface-subtle">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-tint text-accent transition-transform duration-300 group-hover:scale-105">
        <FileText className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          className="font-bold text-ink hover:text-accent"
          href={`/sources/${source.source_id}`}
        >
          {source.title}
        </Link>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-body">
          {source.active_content_text || "Saved source content"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <Badge
            tone={
              source.type === "document"
                ? "document"
                : source.type === "url"
                  ? "url"
                  : "note"
            }
          >
            {source.type}
          </Badge>
          <span>Research</span>
          <span>{formatDisplayDate(source.updated_at)}</span>
        </div>
      </div>
    </article>
  );
}
