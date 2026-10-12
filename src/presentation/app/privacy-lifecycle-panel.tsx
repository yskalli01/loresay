"use client";

import { useActionState, type ReactNode } from "react";
import { Archive, Download, RefreshCw, Trash2 } from "lucide-react";

import {
  archiveSourceAction,
  purgeSourceAction,
  retrySourceIngestionAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import type { SourceSummaryDto } from "@/domain/knowledge";
import { Button, Card, CardBody, Input, Label } from "@/presentation/ui";

const initialState: NoteActionState = {};

export function SourceSettingsPanel({
  canRetry,
  embedded = false,
  sourceId,
  sourceTitle,
}: {
  canRetry: boolean;
  embedded?: boolean;
  sourceId: string;
  sourceTitle: string;
}) {
  const [retryState, retryAction, retryPending] = useActionState(
    retrySourceIngestionAction,
    initialState,
  );
  const [archiveState, archiveAction, archivePending] = useActionState(
    archiveSourceAction,
    initialState,
  );
  const [purgeState, purgeAction, purgePending] = useActionState(
    purgeSourceAction,
    initialState,
  );

  const content = (
    <>
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-base font-bold text-ink">Source Settings</h2>
        <p className="mt-0.5 text-xs leading-5 text-body">
          Archive, retry failed processing, export, or permanently purge this
          source.
        </p>
      </div>

      <div className="divide-y divide-border-subtle px-4">
        <form action={retryAction}>
          <input name="sourceId" type="hidden" value={sourceId} />
          <LifecycleRow
            description="Run the processing again to update the search index."
            icon={<RefreshCw className="h-4 w-4" />}
            title="Reprocess"
          >
            <Button
              disabled={!canRetry || retryPending}
              size="sm"
              type="submit"
              variant="secondary"
            >
              {retryPending ? "Reprocessing" : "Reprocess"}
            </Button>
          </LifecycleRow>
          <ActionMessage state={retryState} />
        </form>

        <form action={archiveAction}>
          <input name="sourceId" type="hidden" value={sourceId} />
          <LifecycleRow
            description="Archive this source so it will not appear in search."
            icon={<Archive className="h-4 w-4" />}
            title="Archive"
          >
            <Button
              disabled={archivePending}
              size="sm"
              type="submit"
              variant="secondary"
            >
              {archivePending ? "Archiving" : "Archive"}
            </Button>
          </LifecycleRow>
          <ActionMessage state={archiveState} />
        </form>

        <LifecycleRow
          description="Export this source as JSON."
          icon={<Download className="h-4 w-4" />}
          title="Export"
        >
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border border-border-subtle bg-surface-raised px-3 text-sm font-semibold text-ink shadow-control hover:border-border hover:bg-surface-subtle"
            download
            href="/api/export"
          >
            Export
          </a>
        </LifecycleRow>

        <details className="group py-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-error marker:hidden [&::-webkit-details-marker]:hidden">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Permanently Delete Source
          </summary>
          <form
            action={purgeAction}
            className="mt-3 space-y-3 rounded-md bg-error-tint p-3"
          >
            <input name="sourceId" type="hidden" value={sourceId} />
            <p className="text-xs leading-5 text-body">
              Type the source title to permanently delete it and its content.
            </p>
            <Label htmlFor="source-delete-confirmation">Source title</Label>
            <Input
              autoComplete="off"
              id="source-delete-confirmation"
              name="confirmation"
              placeholder={sourceTitle}
              required
            />
            <Button
              disabled={purgePending}
              icon={<Trash2 className="h-4 w-4" />}
              size="sm"
              type="submit"
              variant="danger"
            >
              {purgePending ? "Deleting" : "Delete permanently"}
            </Button>
            <ActionMessage state={purgeState} />
          </form>
        </details>
      </div>
    </>
  );

  if (embedded) {
    return (
      <section className="border-t border-border-subtle">{content}</section>
    );
  }

  return (
    <Card>
      <CardBody className="p-0">{content}</CardBody>
    </Card>
  );
}

export function PrivacyLifecyclePanel({
  archivedSources,
}: {
  archivedSources: SourceSummaryDto[];
}) {
  const [state, formAction, pending] = useActionState(
    purgeSourceAction,
    initialState,
  );

  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-ink">Source Settings</h2>
          <p className="mt-1 text-xs text-body">
            Permanently purge archived sources from your knowledge base.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-error/15 bg-error-tint p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-error-soft text-error-strong">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-error-strong">
                Permanently Delete
              </h3>
              <p className="text-xs text-body">
                Permanently delete archived source content.
              </p>
            </div>
          </div>
          {archivedSources.length === 0 ? (
            <p className="text-sm text-muted">No archived sources to purge.</p>
          ) : (
            <div className="space-y-3">
              {archivedSources.map((source) => {
                const inputId = `purge-confirmation-${source.source_id}`;

                return (
                  <form
                    action={formAction}
                    className="space-y-2"
                    key={source.source_id}
                  >
                    <input
                      name="sourceId"
                      type="hidden"
                      value={source.source_id}
                    />
                    <p className="text-sm font-semibold text-ink">
                      {source.title}
                    </p>
                    <Label htmlFor={inputId}>Type source title to purge</Label>
                    <Input
                      autoComplete="off"
                      id={inputId}
                      name="confirmation"
                      placeholder={source.title}
                      required
                    />
                    <Button
                      disabled={pending}
                      icon={<Trash2 className="h-4 w-4" />}
                      size="sm"
                      type="submit"
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </form>
                );
              })}
            </div>
          )}
          <ActionMessage state={state} />
        </div>
      </CardBody>
    </Card>
  );
}

function LifecycleRow({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-tint text-accent">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-bold text-ink">{title}</h3>
          <p className="text-xs text-body">{description}</p>
        </div>
      </div>
      <div className="shrink-0 self-end sm:self-auto">{children}</div>
    </div>
  );
}

function ActionMessage({ state }: { state: NoteActionState }) {
  if (state.error) {
    return <p className="mt-2 text-sm text-error-strong">{state.error}</p>;
  }
  if (state.message) {
    return <p className="mt-2 text-sm text-body">{state.message}</p>;
  }

  return null;
}
