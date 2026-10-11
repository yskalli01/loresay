"use client";

import { useActionState } from "react";
import { FolderPlus } from "lucide-react";

import {
  createCollectionAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import type { CollectionSummaryDto } from "@/application/knowledge/repositories";
import { Badge, Button, Card, CardBody, Input, Label } from "@/presentation/ui";

const initialState: NoteActionState = {};

export function OrganizationPanel({
  collections,
}: {
  collections: CollectionSummaryDto[];
}) {
  const [collectionState, collectionAction, collectionPending] = useActionState(
    createCollectionAction,
    initialState,
  );

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Organization</h2>
          <p className="mt-1 text-sm leading-6 text-body">
            Create collections, then attach them from source detail pages.
          </p>
        </div>

        <form action={collectionAction} className="space-y-3">
          <Label htmlFor="collection-name">New collection</Label>
          <div className="flex gap-2">
            <Input id="collection-name" maxLength={200} name="name" required />
            <Button
              aria-label="Create collection"
              disabled={collectionPending}
              icon={<FolderPlus className="h-4 w-4" />}
              type="submit"
              variant="secondary"
            />
          </div>
          <ActionMessage state={collectionState} />
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Collections</h3>
          <PillList
            empty="No collections yet"
            items={collections.map(
              (item) => `${item.name} (${item.source_count})`,
            )}
          />
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

function PillList({ empty, items }: { empty: string; items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} tone="neutral">
          {item}
        </Badge>
      ))}
    </div>
  );
}
