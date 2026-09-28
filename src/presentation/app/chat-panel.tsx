"use client";

import { FormEvent, type ReactNode, useState } from "react";
import { Bot, Send } from "lucide-react";

import type {
  CollectionSummaryDto,
  TagSummaryDto,
} from "@/application/knowledge/repositories";
import { Button, Card, CardBody, Label, Textarea } from "@/presentation/ui";

export type Citation = {
  citation_id: string;
  source_title_snapshot: string;
  quote: string | null;
  rank: number;
};

type ChatResponse = {
  answer: string;
  citations: Citation[];
  threadId: string;
};

type ChatStreamEvent =
  | {
      text: string;
      type: "delta";
    }
  | (ChatResponse & {
      type: "done";
    })
  | {
      error: string;
      type: "error";
    };

export function ChatPanel({
  collections = [],
  tags = [],
  threadId,
}: {
  collections?: CollectionSummaryDto[];
  tags?: TagSummaryDto[];
  threadId: string | null;
}) {
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    const collectionId = String(form.get("collectionId") ?? "").trim();
    const tagId = String(form.get("tagId") ?? "").trim();

    if (!message) {
      setError("Ask a question first.");
      return;
    }

    setPending(true);
    setError("");
    setAnswer("");
    setCitations([]);

    const response = await fetch("/api/chat", {
      body: JSON.stringify({
        collectionId: collectionId || undefined,
        message,
        tagId: tagId || undefined,
        threadId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok || !response.body) {
      setPending(false);
      setError("The chat request failed. Try again.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffered = "";
    let streamedAnswer = "";

    function handleLine(line: string) {
      if (!line.trim()) {
        return;
      }

      const event = JSON.parse(line) as ChatStreamEvent;

      if (event.type === "delta") {
        streamedAnswer += event.text;
        setAnswer(streamedAnswer);
        return;
      }

      if (event.type === "done") {
        streamedAnswer = event.answer;
        setAnswer(event.answer);
        setCitations(event.citations);
        return;
      }

      throw new Error(event.error);
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      buffered += chunk;
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";

      try {
        lines.forEach(handleLine);
      } catch {
        setError("The chat request failed. Try again.");
        setPending(false);
        return;
      }
    }

    if (buffered) {
      try {
        handleLine(buffered);
      } catch {
        setError("The chat request failed. Try again.");
      }
    }

    setPending(false);
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-on-accent">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">
              Ask your knowledge
            </h2>
            <p className="text-sm text-body">
              Answers search ready sources you own, with optional collection or
              tag scope.
            </p>
          </div>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <Label htmlFor="chat-message">Question</Label>
          <Textarea
            id="chat-message"
            name="message"
            placeholder="What did I save about retrieval quality?"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FilterSelect label="Collection" name="collectionId">
              <option value="">All collections</option>
              {collections.map((collection) => (
                <option
                  key={collection.collection_id}
                  value={collection.collection_id}
                >
                  {collection.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Tag" name="tagId">
              <option value="">All tags</option>
              {tags.map((tag) => (
                <option key={tag.tag_id} value={tag.tag_id}>
                  {tag.name}
                </option>
              ))}
            </FilterSelect>
          </div>
          {error ? (
            <p className="rounded-md border border-error/40 bg-error-soft px-3 py-2 text-sm text-error">
              {error}
            </p>
          ) : null}
          <Button
            disabled={pending}
            icon={<Send className="h-4 w-4" />}
            type="submit"
          >
            {pending ? "Answering..." : "Ask"}
          </Button>
        </form>

        {answer ? (
          <section
            aria-live="polite"
            className="rounded-md border border-border-subtle bg-surface-subtle p-4"
          >
            <h3 className="text-sm font-semibold text-ink">Answer</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
              {answer}
            </p>
            <CitationList citations={citations} />
          </section>
        ) : null}
      </CardBody>
    </Card>
  );
}

function FilterSelect({
  children,
  label,
  name,
}: {
  children: ReactNode;
  label: string;
  name: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase text-muted">{label}</span>
      <select
        className="h-11 w-full rounded-md border border-border-subtle bg-surface px-3 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        name={name}
      >
        {children}
      </select>
    </label>
  );
}

export function CitationList({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="answer-citations-heading" className="mt-4">
      <h4
        className="text-xs font-semibold uppercase tracking-normal text-muted"
        id="answer-citations-heading"
      >
        Sources cited
      </h4>
      <ol className="mt-2 space-y-2">
        {citations.map((citation) => (
          <li
            className="rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm text-body"
            key={citation.citation_id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">
                [{citation.rank}]
              </span>
              <span className="font-semibold text-ink">
                {citation.source_title_snapshot}
              </span>
              <span className="text-xs text-muted">Chunk {citation.rank}</span>
            </div>
            {citation.quote ? (
              <blockquote className="mt-2 border-l-2 border-border pl-3 text-sm leading-6 text-body">
                {citation.quote}
              </blockquote>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
