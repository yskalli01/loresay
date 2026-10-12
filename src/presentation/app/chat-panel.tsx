"use client";

import { FormEvent, type ReactNode, useRef, useState } from "react";
import {
  Bot,
  FileText,
  Link2,
  Loader2,
  Send,
  Sparkles,
  User,
} from "lucide-react";

import type { CollectionSummaryDto } from "@/application/knowledge/repositories";

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

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  citations?: Citation[];
  pending?: boolean;
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
  threadId,
}: {
  collections?: CollectionSummaryDto[];
  threadId: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(threadId);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateAssistantMessage(
    id: string,
    update: Partial<Omit<ChatMessage, "id" | "role">>,
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, ...update } : message,
      ),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    const collectionId = String(form.get("collectionId") ?? "").trim();

    if (!message) {
      setError("Ask a question first.");
      return;
    }

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      { content: message, id: userMessageId, role: "user" },
      {
        content: "",
        citations: [],
        id: assistantMessageId,
        pending: true,
        role: "assistant",
      },
    ]);
    setPending(true);
    setError("");
    inputRef.current!.value = "";

    const response = await fetch("/api/chat", {
      body: JSON.stringify({
        collectionId: collectionId || undefined,
        message,
        threadId: activeThreadId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok || !response.body) {
      const message = "The chat request failed. Try again.";
      setPending(false);
      setError(message);
      updateAssistantMessage(assistantMessageId, {
        content: message,
        pending: false,
      });
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
        updateAssistantMessage(assistantMessageId, {
          content: streamedAnswer,
        });
        return;
      }

      if (event.type === "done") {
        streamedAnswer = event.answer;
        setActiveThreadId(event.threadId);
        updateAssistantMessage(assistantMessageId, {
          citations: event.citations,
          content: event.answer,
          pending: false,
        });
        return;
      }

      updateAssistantMessage(assistantMessageId, {
        content: event.error,
        pending: false,
      });
      throw new Error(event.error);
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        buffered += chunk;
        const lines = buffered.split("\n");
        buffered = lines.pop() ?? "";

        lines.forEach(handleLine);
      }

      if (buffered) {
        handleLine(buffered);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The chat request failed. Try again.",
      );
      updateAssistantMessage(assistantMessageId, { pending: false });
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card">
      <div className="border-b border-border-subtle px-4 py-3">
        <h1 className="text-lg font-bold text-ink">Chat with Your Knowledge</h1>
        <p className="mt-1 text-sm text-body">
          Ask grounded questions across all saved sources, or narrow retrieval
          by collection.
        </p>
      </div>

      <div
        aria-live="polite"
        className="flex-1 space-y-4 overflow-y-auto bg-surface-subtle/50 p-4"
      >
        {messages.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface px-6 text-center">
            <div className="max-w-md space-y-3">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-accent-tint text-accent">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-base font-bold text-ink">
                Start a grounded chat
              </h2>
              <p className="text-sm leading-6 text-body">
                Ask about your saved notes, documents, and URLs. Use the filters
                below when you want the answer to focus on one collection.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}

        {error ? (
          <p
            className="rounded-lg border border-error/20 bg-error-tint px-3 py-2 text-sm font-medium text-error-strong"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <form
        className="border-t border-border-subtle bg-surface p-3"
        onSubmit={onSubmit}
      >
        <div className="mb-2 max-w-sm">
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
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised p-2 shadow-control focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
          <Sparkles
            className="h-4 w-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <label className="sr-only" htmlFor="chat-message">
            Ask a question about your knowledge
          </label>
          <input
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            disabled={pending}
            id="chat-message"
            name="message"
            placeholder="Ask a question about your knowledge..."
            ref={inputRef}
            required
          />
          <button
            aria-label={pending ? "Sending question" : "Send question"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-on-accent shadow-control hover:bg-accent-strong disabled:bg-accent-soft"
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted" role="status">
          {pending ? "Answering from your saved knowledge..." : ""}
        </p>
      </form>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-xl rounded-lg bg-accent-soft px-4 py-3 text-sm font-medium leading-6 text-accent-strong">
          {message.content}
        </div>
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <User className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-tint text-accent">
        <Bot className="h-4 w-4" aria-hidden="true" />
      </span>
      <article className="max-w-3xl rounded-lg border border-border-subtle bg-surface p-4 shadow-control">
        <p className="whitespace-pre-wrap text-sm leading-6 text-body">
          {message.content ||
            (message.pending ? "Answering..." : "No answer returned.")}
        </p>
        <CitationList citations={message.citations ?? []} />
      </article>
    </div>
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
    <label className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-normal text-muted">
        {label}
      </span>
      <select
        className="h-10 w-full rounded-sm border border-border-subtle bg-surface-raised px-3 text-sm text-ink shadow-control transition hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
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
            className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-3 text-sm text-body"
            key={citation.citation_id}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-tint text-accent">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">
                  {citation.source_title_snapshot}
                </p>
                <p className="mt-1 text-xs text-muted">
                  [{citation.rank}] / Chunk {citation.rank}
                </p>
                {citation.quote ? (
                  <p className="mt-2 text-sm leading-6 text-body">
                    {citation.quote}
                  </p>
                ) : null}
              </div>
              <Link2
                className="ml-auto h-4 w-4 shrink-0 text-muted"
                aria-hidden="true"
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
