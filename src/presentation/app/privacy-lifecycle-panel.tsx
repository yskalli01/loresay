"use client";

import { useActionState } from "react";
import { Download, Trash2 } from "lucide-react";

import {
  purgeSourceAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import type { SourceSummaryDto } from "@/domain/knowledge";
import { Button, Card, CardBody, Input, Label } from "@/presentation/ui";

const initialState: NoteActionState = {};

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
      <CardBody className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Privacy and data lifecycle
          </h2>
          <p className="mt-1 text-sm leading-6 text-body">
            Export your owned knowledge or permanently purge archived source
            content.
          </p>
        </div>

        <a
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border-subtle bg-surface-raised px-4 text-sm font-medium text-ink shadow-sm transition hover:border-border hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent/20"
          download
          href="/api/export"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export knowledge
        </a>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Archived sources</h3>
          {archivedSources.length === 0 ? (
            <p className="text-sm text-muted">No archived sources to purge.</p>
          ) : (
            <div className="space-y-4">
              {archivedSources.map((source) => {
                const inputId = `purge-confirmation-${source.source_id}`;

                return (
                  <form
                    action={formAction}
                    className="space-y-3 border-t border-border-subtle pt-4 first:border-t-0 first:pt-0"
                    key={source.source_id}
                  >
                    <input
                      name="sourceId"
                      type="hidden"
                      value={source.source_id}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-ink">
                        {source.title}
                      </p>
                      <p className="break-all text-xs text-muted">
                        {source.source_id}
                      </p>
                    </div>
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
                      type="submit"
                      variant="danger"
                    >
                      Permanently purge
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

function ActionMessage({ state }: { state: NoteActionState }) {
  if (state.error) {
    return <p className="text-sm text-error">{state.error}</p>;
  }
  if (state.message) {
    return <p className="text-sm text-body">{state.message}</p>;
  }

  return null;
}
