"use client";

import { useActionState } from "react";
import { Link2 } from "lucide-react";

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
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Add a URL</h2>
          <p className="mt-1 text-sm leading-6 text-body">
            Fetch a web page or plain text URL and add its readable text to
            retrieval.
          </p>
        </div>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source-url">URL</Label>
            <Input
              id="source-url"
              name="url"
              placeholder="https://example.com/article"
              required
              type="url"
            />
          </div>
          {state.error ? (
            <p className="rounded-md border border-error/40 bg-error-soft px-3 py-2 text-sm text-error">
              {state.error}
            </p>
          ) : null}
          {state.message ? (
            <p className="rounded-md border border-success/40 bg-success-soft px-3 py-2 text-sm text-body">
              {state.message}
            </p>
          ) : null}
          <Button
            disabled={pending}
            icon={<Link2 className="h-4 w-4" />}
            type="submit"
            variant="secondary"
          >
            {pending ? "Fetching URL..." : "Fetch and process"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
