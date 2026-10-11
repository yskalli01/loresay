"use client";

import { type KeyboardEvent, useId, useState, type ReactNode } from "react";
import { FileUp, Link2, StickyNote } from "lucide-react";

import { DocumentUploadForm } from "@/presentation/app/document-upload-form";
import { NoteForm } from "@/presentation/app/note-form";
import { UrlIngestionForm } from "@/presentation/app/url-ingestion-form";

type NewSourceTab = "note" | "document" | "url";

const tabs: Array<{
  id: NewSourceTab;
  icon: ReactNode;
  label: string;
}> = [
  {
    id: "note",
    icon: <StickyNote className="h-5 w-5" />,
    label: "Note",
  },
  {
    id: "document",
    icon: <FileUp className="h-5 w-5" />,
    label: "Document",
  },
  {
    id: "url",
    icon: <Link2 className="h-5 w-5" />,
    label: "URL",
  },
];

export function NewSourceTabs() {
  const [activeTab, setActiveTab] = useState<NewSourceTab>("note");
  const idBase = useId();

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
    <section className="space-y-5" aria-labelledby="new-source-tabs-title">
      <div>
        <h2 className="text-base font-bold text-ink" id="new-source-tabs-title">
          Add source
        </h2>
        <p className="mt-1 text-sm text-body">
          Choose how you want to add knowledge: write a note, upload a document,
          or save a web page.
        </p>
      </div>

      <div
        aria-label="Source type"
        className="grid gap-3 sm:grid-cols-3"
        onKeyDown={handleKeyDown}
        role="tablist"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;

          return (
            <button
              aria-controls={`${idBase}-${tab.id}-panel`}
              aria-selected={selected}
              className={
                selected
                  ? "flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-accent bg-accent-tint text-sm font-semibold text-accent-strong shadow-card transition hover:bg-accent-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  : "flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface-raised text-sm font-semibold text-body shadow-sm transition hover:border-accent/25 hover:bg-accent-tint/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              }
              id={`${idBase}-${tab.id}-tab`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={`${idBase}-${activeTab}-tab`}
        id={`${idBase}-${activeTab}-panel`}
        role="tabpanel"
      >
        {activeTab === "note" ? <NoteForm spacious /> : null}
        {activeTab === "document" ? <DocumentUploadForm /> : null}
        {activeTab === "url" ? <UrlIngestionForm /> : null}
      </div>
    </section>
  );
}
