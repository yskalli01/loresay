"use client";

import { useActionState } from "react";

import {
  createUrlSourceAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import { Button, Card, CardBody, Input, Label } from "@/presentation/ui";

const initialState: NoteActionState = {};

export function UrlIngestionForm() {
  const [state, action, pending] = useActionState(
    createUrlSourceAction,
    initialState,
  );

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <h2 className="text-base font-bold text-ink">Add URL</h2>
          <p className="mt-1 text-xs text-body">
            Extract and save content from a web page.
          </p>
        </div>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source-url">URL</Label>
            <div className="flex gap-2">
              <Input
                id="source-url"
                name="url"
                placeholder="https://example.com/article"
                required
                type="url"
              />
              <Button disabled={pending} type="submit" variant="secondary">
                {pending ? "Fetching..." : "Fetch Content"}
              </Button>
            </div>
          </div>
          {state.error ? (
            <p className="rounded-md border border-error/20 bg-error-tint px-3 py-2 text-sm font-medium text-error-strong">
              {state.error}
            </p>
          ) : null}
          {state.message ? (
            <p className="rounded-md border border-success/20 bg-success-tint px-3 py-2 text-sm font-medium text-success-strong">
              {state.message}
            </p>
          ) : null}
        </form>
      </CardBody>
    </Card>
  );
}
