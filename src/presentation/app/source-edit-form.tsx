"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import {
  updateTextNoteAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import { Button, Input, Label, Textarea } from "@/presentation/ui";

const initialState: NoteActionState = {};

type SourceEditFormProps = {
  body: string;
  sourceId: string;
  title: string;
};

export function SourceEditForm({ body, sourceId, title }: SourceEditFormProps) {
  const [state, action, pending] = useActionState(
    updateTextNoteAction,
    initialState,
  );

  return (
    <form
      action={action}
      className="mt-5 space-y-4 border-t border-border-subtle pt-5"
    >
      <input name="sourceId" type="hidden" value={sourceId} />
      <div className="space-y-2">
        <Label htmlFor={`edit-title-${sourceId}`}>Edit title</Label>
        <Input
          defaultValue={title}
          id={`edit-title-${sourceId}`}
          maxLength={200}
          name="title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`edit-body-${sourceId}`}>Edit note body</Label>
        <Textarea
          className="min-h-56"
          defaultValue={body}
          id={`edit-body-${sourceId}`}
          maxLength={20_000}
          name="body"
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
        icon={<Save className="h-4 w-4" />}
        size="sm"
        type="submit"
        variant="secondary"
      >
        {pending ? "Reprocessing..." : "Update note"}
      </Button>
    </form>
  );
}
