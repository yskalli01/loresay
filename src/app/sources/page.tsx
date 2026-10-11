import { Plus } from "lucide-react";
import Link from "next/link";

import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import {
  parseSourceFilters,
  SourceFilterBar,
} from "@/presentation/app/source-filter-bar";
import { SourceLibraryTable } from "@/presentation/app/source-library-table";
import { Button } from "@/presentation/ui";

const sourceTabs = [
  { href: "/sources", label: "All" },
  { href: "/sources?type=note", label: "Notes" },
  { href: "/sources?type=document", label: "Documents" },
  { href: "/sources?type=url", label: "URLs" },
];

export default async function SourcesPage(props?: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const searchParams = props?.searchParams ? await props.searchParams : {};
  const filters = parseSourceFilters(searchParams);
  const [sourceList, collections] = await Promise.all([
    knowledgeRepository.listKnowledgeSources({
      filters,
      limit: 24,
      owner,
    }),
    knowledgeRepository.listCollections({ owner }),
  ]);

  return (
    <AppShell activePath="/sources">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-ink">
              Sources
            </h1>
            <p className="mt-1 text-sm text-body">
              Browse, filter, and manage all your saved sources.
            </p>
          </div>
          <Link href="/new-source">
            <Button icon={<Plus className="h-4 w-4" />}>Add Source</Button>
          </Link>
        </div>

        <SourceFilterBar collections={collections} filters={filters} />

        <div className="space-y-4 rounded-lg border border-border-subtle bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            {sourceTabs.map((tab) => {
              const active =
                (!filters.type && tab.label === "All") ||
                tab.href.endsWith(`=${filters.type}`);

              return (
                <Link
                  className={
                    active
                      ? "inline-flex h-9 items-center rounded-md bg-accent px-3 text-xs font-semibold text-on-accent shadow-control"
                      : "inline-flex h-9 items-center rounded-md border border-border-subtle bg-surface-raised px-3 text-xs font-semibold text-body hover:bg-surface-subtle"
                  }
                  href={tab.href}
                  key={tab.label}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <SourceLibraryTable sources={sourceList.items} />
        </div>
      </div>
    </AppShell>
  );
}
