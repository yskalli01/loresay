"use client";

import { useActionState } from "react";
import { Plus, Unlink } from "lucide-react";

import {
  addSourcesToCollectionAction,
  removeSourcesFromCollectionAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import type { SourceSummaryDto } from "@/domain/knowledge";
import { Button } from "@/presentation/ui";

import { CollectionSourcePicker } from "./collection-source-picker";

const initialState: NoteActionState = {};

export function CollectionSourceAttachForm({
  attachedSources,
  availableSources,
  collectionId,
}: {
  attachedSources: SourceSummaryDto[];
  availableSources: SourceSummaryDto[];
  collectionId: string;
}) {
  const [addState, addAction, addPending] = useActionState(
    addSourcesToCollectionAction,
    initialState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeSourcesFromCollectionAction,
    initialState,
  );

  return (
    <section className="rounded-lg border border-border-subtle bg-surface p-5 shadow-card">
      <div>
        <h2 className="text-base font-bold text-ink">Manage sources</h2>
        <p className="mt-1 text-sm text-body">
          Add several sources at once or remove sources from this collection.
        </p>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-2">
        <form
          action={addAction}
          className="space-y-4 border-t border-border-subtle pt-5"
        >
          <input name="collectionId" type="hidden" value={collectionId} />
          <div>
            <h3 className="text-sm font-bold text-ink">Add sources</h3>
            <p className="mt-1 text-sm text-body">
              Choose any sources that are not already in this collection.
            </p>
          </div>
          <CollectionSourcePicker
            emptyMessage="All available sources are already attached."
            label="Sources to add"
            searchPlaceholder="Search sources to add"
            sources={availableSources}
          />
          <Button
            disabled={addPending || availableSources.length === 0}
            icon={<Plus className="h-4 w-4" />}
            type="submit"
          >
            {addPending ? "Adding..." : "Add selected"}
          </Button>
          <ActionMessage state={addState} />
        </form>

        <form
          action={removeAction}
          className="space-y-4 border-t border-border-subtle pt-5"
        >
          <input name="collectionId" type="hidden" value={collectionId} />
          <div>
            <h3 className="text-sm font-bold text-ink">Remove sources</h3>
            <p className="mt-1 text-sm text-body">
              Sources stay in your library after they are removed here.
            </p>
          </div>
          <CollectionSourcePicker
            emptyMessage="This collection has no sources to remove."
            label="Sources to remove"
            searchPlaceholder="Search sources to remove"
            sources={attachedSources}
          />
          <Button
            disabled={removePending || attachedSources.length === 0}
            icon={<Unlink className="h-4 w-4" />}
            type="submit"
            variant="danger"
          >
            {removePending ? "Removing..." : "Remove selected"}
          </Button>
          <ActionMessage state={removeState} />
        </form>
      </div>
    </section>
  );
}

function ActionMessage({ state }: { state: NoteActionState }) {
  if (state.error) {
    return (
      <p className="rounded-md border border-error/20 bg-error-tint px-3 py-2 text-sm font-medium text-error-strong">
        {state.error}
      </p>
    );
  }

  if (state.message) {
    return (
      <p className="rounded-md border border-success/20 bg-success-tint px-3 py-2 text-sm font-medium text-success-strong">
        {state.message}
      </p>
    );
  }

  return null;
}
