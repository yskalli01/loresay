"use client";

import { useActionState } from "react";
import { Archive, RotateCcw } from "lucide-react";

import {
  archiveSourceAction,
  retrySourceIngestionAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import { Button } from "@/presentation/ui";

const initialState: NoteActionState = {};

export function SourceLifecycleActions({
  canRetry,
  sourceId,
}: {
  canRetry: boolean;
  sourceId: string;
}) {
  const [retryState, retryAction, retryPending] = useActionState(
    retrySourceIngestionAction,
    initialState,
  );
  const [archiveState, archiveAction, archivePending] = useActionState(
    archiveSourceAction,
    initialState,
  );

  return (
    <div className="space-y-3">
      {canRetry ? (
        <form action={retryAction}>
          <input name="sourceId" type="hidden" value={sourceId} />
          <Button
            className="w-full"
            disabled={retryPending}
            icon={<RotateCcw className="h-4 w-4" />}
            type="submit"
            variant="secondary"
          >
            {retryPending ? "Retrying..." : "Retry ingestion"}
          </Button>
          <ActionMessage state={retryState} />
        </form>
      ) : null}

      <form action={archiveAction}>
        <input name="sourceId" type="hidden" value={sourceId} />
        <Button
          className="w-full"
          disabled={archivePending}
          icon={<Archive className="h-4 w-4" />}
          type="submit"
          variant="danger"
        >
          {archivePending ? "Archiving..." : "Archive source"}
        </Button>
        <ActionMessage state={archiveState} />
      </form>
    </div>
  );
}

function ActionMessage({ state }: { state: NoteActionState }) {
  if (state.error) {
    return <p className="mt-2 text-sm text-error">{state.error}</p>;
  }
  if (state.message) {
    return <p className="mt-2 text-sm text-body">{state.message}</p>;
  }

  return null;
}
