"use client";

import { useActionState } from "react";
import { FolderPlus } from "lucide-react";

import {
  addSourceToCollectionAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import type { CollectionSummaryDto } from "@/application/knowledge/repositories";
import { Button, Label } from "@/presentation/ui";

const initialState: NoteActionState = {};

export function SourceOrganizationForms({
  collections,
  sourceId,
}: {
  collections: CollectionSummaryDto[];
  sourceId: string;
}) {
  const [collectionState, collectionAction, collectionPending] = useActionState(
    addSourceToCollectionAction,
    initialState,
  );

  return (
    <form
      action={collectionAction}
      className="space-y-2 border-t border-border-subtle pt-3"
    >
      <input name="sourceId" type="hidden" value={sourceId} />
      <Label htmlFor="source-collection">Attach collection</Label>
      <div className="flex gap-2">
        <select
          className="h-11 min-w-0 flex-1 rounded-md border border-border-subtle bg-surface px-3 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          id="source-collection"
          name="collectionId"
          required
        >
          <option value="">Choose collection</option>
          {collections.map((collection) => (
            <option
              key={collection.collection_id}
              value={collection.collection_id}
            >
              {collection.name}
            </option>
          ))}
        </select>
        <Button
          aria-label="Attach collection"
          disabled={collectionPending || collections.length === 0}
          icon={<FolderPlus className="h-4 w-4" />}
          size="icon"
          type="submit"
          variant="secondary"
        />
      </div>
      <ActionMessage state={collectionState} />
    </form>
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
