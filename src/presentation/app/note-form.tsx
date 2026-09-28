"use client";

import { useActionState } from "react";
import { FilePlus2 } from "lucide-react";

import {
  createTextNoteAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import {
  Button,
  Card,
  CardBody,
  Input,
  Label,
  Textarea,
} from "@/presentation/ui";

const initialState: NoteActionState = {};

type NoteFormProps = {
  spacious?: boolean;
};

export function NoteForm({ spacious = false }: NoteFormProps) {
  const [state, action, pending] = useActionState(
    createTextNoteAction,
    initialState,
  );

  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Write a note</h2>
            <p className="mt-1 text-sm leading-6 text-body">
              Markdown style text works well here. Notes up to 20,000 characters
              are processed inline for grounded chat.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Markdown friendly
          </p>
        </div>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              maxLength={200}
              name="title"
              placeholder="Optional note title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-body">Note body</Label>
            <Textarea
              className={spacious ? "min-h-[420px] text-base" : "min-h-44"}
              id="note-body"
              maxLength={20_000}
              name="body"
              placeholder="Use headings, bullet points, links, or pasted research notes."
              required
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
            icon={<FilePlus2 className="h-4 w-4" />}
            type="submit"
          >
            {pending ? "Processing note..." : "Save and process"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
