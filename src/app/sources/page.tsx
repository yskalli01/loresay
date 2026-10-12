import { Plus } from "lucide-react";
import Link from "next/link";

import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { PageHeader } from "@/presentation/app/page-header";
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
      <div className="space-y-4">
        <PageHeader
          description="Browse, filter, and manage all your saved sources."
          title="Sources"
          actions={
            <Link href="/new-source">
              <Button icon={<Plus className="h-4 w-4" />}>Add source</Button>
            </Link>
          }
        />

        <SourceFilterBar collections={collections} filters={filters} />

        <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card">
          <div className="flex flex-wrap items-center gap-1 border-b border-border-subtle px-3 py-2">
            {sourceTabs.map((tab) => {
              const active =
                (!filters.type && tab.label === "All") ||
                tab.href.endsWith(`=${filters.type}`);

              return (
                <Link
                  className={
                    active
                      ? "inline-flex h-9 items-center rounded-md bg-accent-tint px-3 text-xs font-semibold text-accent-strong"
                      : "inline-flex h-9 items-center rounded-md px-3 text-xs font-semibold text-body hover:bg-surface-subtle hover:text-ink"
                  }
                  href={tab.href}
                  key={tab.label}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <div className="p-3">
            <SourceLibraryTable sources={sourceList.items} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
