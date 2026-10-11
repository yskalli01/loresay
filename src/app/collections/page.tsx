import type { CollectionListFilters } from "@/application/knowledge/repositories";
import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { AppShell } from "@/presentation/app/app-shell";
import { CollectionManager } from "@/presentation/app/collection-manager";

export default async function CollectionsPage(props?: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireSessionUser();
  const owner = { userId: user.id };
  const searchParams = props?.searchParams ? await props.searchParams : {};
  const filters = parseCollectionFilters(searchParams);
  const [collections, sources] = await Promise.all([
    knowledgeRepository.listCollections({ filters, owner }),
    knowledgeRepository.listKnowledgeSources({ limit: 100, owner }),
  ]);

  return (
    <AppShell activePath="/collections">
      <CollectionManager
        collections={collections}
        filters={filters}
        sources={sources.items}
      />
    </AppShell>
  );
}

function parseCollectionFilters(
  searchParams: Record<string, string | string[] | undefined>,
): CollectionListFilters {
  const value = (key: string) => {
    const current = searchParams[key];
    return Array.isArray(current) ? current[0] : current;
  };

  return {
    createdFrom: collectionDateFilter(value("from")),
    createdTo: collectionDateFilter(value("to")),
    hasImage: booleanFilter(value("image"), "with", "none"),
    hasSources: booleanFilter(value("sources"), "with", "empty"),
    query: value("q") || undefined,
    sort: collectionSort(value("sort")),
  };
}

function collectionDateFilter(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : value;
}

function booleanFilter(value: string | undefined, yes: string, no: string) {
  if (value === yes) {
    return true;
  }
  if (value === no) {
    return false;
  }
  return undefined;
}

function collectionSort(value?: string): CollectionListFilters["sort"] {
  return value === "newest" ||
    value === "source_count" ||
    value === "updated" ||
    value === "name"
    ? value
    : "name";
}
