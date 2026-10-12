"use client";

import { startTransition, useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  deleteCollectionAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import type { CollectionSummaryDto } from "@/application/knowledge/repositories";
import type { SourceSummaryDto } from "@/domain/knowledge";
import { Button } from "@/presentation/ui";

import { CollectionModal } from "./collection-manager";

const initialState: NoteActionState = {};

export function CollectionDetailActions({
  collection,
  sources,
}: {
  collection: CollectionSummaryDto;
  sources: SourceSummaryDto[];
}) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const [deleteState, deleteAction, deletePending] = useActionState(
    async (previousState: NoteActionState, formData: FormData) => {
      const nextState = await deleteCollectionAction(previousState, formData);
      if (!nextState.error) {
        startTransition(() => router.push("/collections"));
      }
      return nextState;
    },
    initialState,
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          icon={<Pencil className="h-4 w-4" />}
          onClick={() => setEditing(true)}
          size="sm"
          type="button"
          variant="secondary"
        >
          Edit
        </Button>
        <details className="group relative">
          <summary className="inline-flex h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-error transition hover:bg-error-tint marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error [&::-webkit-details-marker]:hidden">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </summary>
          <form
            action={deleteAction}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-64 rounded-lg border border-border-subtle bg-surface p-3 shadow-panel"
          >
            <input
              name="collectionId"
              type="hidden"
              value={collection.collection_id}
            />
            <p className="text-sm font-semibold text-ink">Delete collection?</p>
            <p className="mt-1 text-xs leading-5 text-body">
              Sources stay in your library. This cannot be undone.
            </p>
            <Button
              className="mt-3 w-full"
              disabled={deletePending}
              size="sm"
              type="submit"
              variant="danger"
            >
              {deletePending ? "Deleting..." : "Confirm delete"}
            </Button>
            {deleteState.error ? (
              <p className="mt-2 text-xs font-medium text-error-strong">
                {deleteState.error}
              </p>
            ) : null}
          </form>
        </details>
      </div>

      {editing ? (
        <CollectionModal
          collection={collection}
          mode="edit"
          onClose={() => setEditing(false)}
          sources={sources}
        />
      ) : null}
    </>
  );
}
