import type { SourceCardProps } from "@/presentation/ui";

// PLACEHOLDER: replaced by the thin knowledge loop and source data integration.
export const recentSources: Array<SourceCardProps & { id: string }> = [
  {
    collections: ["Research"],
    id: "source-1",
    status: "ready",
    tags: ["retrieval"],
    title: "Retrieval notes from product planning",
    type: "note",
    updatedAt: "2026-09-10",
  },
  {
    collections: ["Reading"],
    id: "source-2",
    status: "processing",
    tags: ["rag"],
    title: "Grounded answer quality draft",
    type: "document",
    updatedAt: "2026-09-09",
  },
  {
    collections: ["Inbox"],
    id: "source-3",
    status: "failed",
    tags: ["url"],
    title: "Article import with blocked extraction",
    type: "url",
    updatedAt: "2026-09-08",
  },
];

export const ingestionSummary = {
  failedCount: 1,
  latestActivity: "Last import attempt 14 minutes ago",
  processingCount: 1,
  queuedCount: 2,
};

export const chatEntrySummary = {
  href: "/chat",
  lastMessagePreview: "Ask a question once your first source is ready.",
  title: "Grounded chat",
};

export const dashboardMetrics = [
  {
    label: "Ready sources",
    value: "18",
    detail: "Across notes, docs, and URLs",
  },
  { label: "Active chunks", value: "426", detail: "Eligible for retrieval" },
  { label: "Open ingestion jobs", value: "3", detail: "Queued or processing" },
];
