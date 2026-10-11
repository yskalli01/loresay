"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import {
  updateTextNoteAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import { Button, Input, Label } from "@/presentation/ui";

import { MarkdownEditorField } from "./markdown-editor-field";

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
        <Label htmlFor={`edit-title-${sourceId}`}>Title</Label>
        <Input
          defaultValue={title}
          id={`edit-title-${sourceId}`}
          maxLength={200}
          name="title"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <MarkdownEditorField
          defaultMarkdown={body}
          editorClassName="min-h-64"
          placeholder="Update note content..."
        />
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
      <Button
        disabled={pending}
        icon={<Save className="h-4 w-4" />}
        size="sm"
        type="submit"
        variant="secondary"
      >
        {pending ? "Reprocessing..." : "Save changes"}
      </Button>
    </form>
  );
}
