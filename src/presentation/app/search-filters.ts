import type { SourceListFilters } from "@/application/knowledge/repositories";
import type { SourceType } from "@/domain/knowledge";

export type SearchTimePreset = "today" | "7d" | "30d" | "90d" | "year";

export type SearchFilters = {
  collectionId?: string;
  query?: string;
  time?: SearchTimePreset;
  type?: SourceType;
};

export type SelectOption<T extends string> = {
  label: string;
  value: T;
};

export const typeOptions: ReadonlyArray<SelectOption<"" | SourceType>> = [
  { label: "All Types", value: "" },
  { label: "Note", value: "note" },
  { label: "Document", value: "document" },
  { label: "URL", value: "url" },
];

export const timeOptions: ReadonlyArray<SelectOption<"" | SearchTimePreset>> = [
  { label: "Any Time", value: "" },
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "This year", value: "year" },
];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseSearchFilters(
  searchParams: Record<string, string | string[] | undefined>,
): SearchFilters {
  const value = (key: string) => {
    const current = searchParams[key];
    return Array.isArray(current) ? current[0] : current;
  };

  return {
    collectionId: collectionIdFilter(value("collection")),
    query: value("q")?.trim() || undefined,
    time: timeFilter(value("time")),
    type: typeFilter(value("type")),
  };
}

export function resolveSearchTimeRange(
  preset: SearchTimePreset | undefined,
  now: Date = new Date(),
): { createdFrom?: string; createdTo?: string } {
  if (!preset) {
    return {};
  }

  const today = startOfDay(now);
  let from: Date;

  switch (preset) {
    case "today":
      from = today;
      break;
    case "7d":
      from = addDays(today, -6);
      break;
    case "30d":
      from = addDays(today, -29);
      break;
    case "90d":
      from = addDays(today, -89);
      break;
    case "year":
      from = new Date(today.getFullYear(), 0, 1);
      break;
  }

  return { createdFrom: formatDate(from), createdTo: formatDate(today) };
}

export function buildSearchSourceFilters(
  filters: SearchFilters,
  now: Date = new Date(),
): SourceListFilters {
  const range = resolveSearchTimeRange(filters.time, now);
  const sourceFilters: SourceListFilters = {};

  if (filters.query) {
    sourceFilters.query = filters.query;
  }
  if (filters.type) {
    sourceFilters.type = filters.type;
  }
  if (filters.collectionId) {
    sourceFilters.collectionId = filters.collectionId;
  }
  if (range.createdFrom) {
    sourceFilters.createdFrom = range.createdFrom;
  }
  if (range.createdTo) {
    sourceFilters.createdTo = range.createdTo;
  }

  return sourceFilters;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function collectionIdFilter(value?: string): string | undefined {
  return value && uuidPattern.test(value) ? value : undefined;
}

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function timeFilter(value?: string): SearchTimePreset | undefined {
  return value === "today" ||
    value === "7d" ||
    value === "30d" ||
    value === "90d" ||
    value === "year"
    ? value
    : undefined;
}

function typeFilter(value?: string): SourceType | undefined {
  return value === "note" || value === "document" || value === "url"
    ? value
    : undefined;
}
