"use client";

import { type KeyboardEvent, useState } from "react";

import type { SourceCitationDto } from "@/application/knowledge/repositories";
import { formatDisplayDate } from "@/presentation/lib/format-date";
import { Badge, Card, CardBody, CardHeader } from "@/presentation/ui";

type SourceDetailTab = "content" | "citations";

type SourceDetailTabsProps = {
  activeContentText: string | null;
  citations: SourceCitationDto[];
};

const tabs: Array<{ id: SourceDetailTab; label: string }> = [
  { id: "content", label: "Content" },
  { id: "citations", label: "Citations" },
];

export function SourceDetailTabs({
  activeContentText,
  citations,
}: SourceDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<SourceDetailTab>("content");
  const activeLabel =
    tabs.find((tab) => tab.id === activeTab)?.label ?? "Content";

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const offset = event.key === "ArrowLeft" ? -1 : 1;
    const nextIndex = (currentIndex + offset + tabs.length) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  }

  return (
    <Card>
      <div
        aria-label="Source detail sections"
        className="flex flex-wrap gap-1 border-b border-border-subtle px-3 pt-2"
        onKeyDown={handleKeyDown}
        role="tablist"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;

          return (
            <button
              aria-controls={`source-${tab.id}-panel`}
              aria-selected={selected}
              className={
                selected
                  ? "border-b-2 border-accent px-3 pb-2 text-sm font-semibold text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  : "px-3 pb-2 text-sm font-semibold text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              }
              id={`source-${tab.id}-tab`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <CardHeader>
        <h2 className="text-base font-bold text-ink">{activeLabel}</h2>
      </CardHeader>
      <CardBody>
        <div
          aria-labelledby="source-content-tab"
          hidden={activeTab !== "content"}
          id="source-content-panel"
          role="tabpanel"
        >
          {activeContentText ? (
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md bg-surface-subtle p-4 text-sm leading-6 text-body">
              {activeContentText}
            </pre>
          ) : (
            <EmptyPanel message="No extracted text is active for this source yet." />
          )}
        </div>

        <div
          aria-labelledby="source-citations-tab"
          hidden={activeTab !== "citations"}
          id="source-citations-panel"
          role="tabpanel"
        >
          {citations.length > 0 ? (
            <ul className="space-y-3">
              {citations.map((citation) => (
                <li
                  className="rounded-md bg-surface-subtle p-4"
                  key={citation.citation_id}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge tone="accent">#{citation.rank}</Badge>
                    <span className="font-semibold text-body">
                      {citation.thread_title}
                    </span>
                    <span>Chunk {citation.chunk_position}</span>
                    <span>{formatDisplayDate(citation.cited_at)}</span>
                  </div>
                  {citation.quote ? (
                    <p className="mt-2 text-sm leading-6 text-body">
                      {citation.quote}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyPanel message="No citations are attached directly to this source view yet." />
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <p className="rounded-md bg-surface-subtle p-4 text-sm text-body">
      {message}
    </p>
  );
}
