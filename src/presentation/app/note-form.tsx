"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Save } from "lucide-react";

import {
  createTextNoteAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import { Button, Card, CardBody, Input, Label } from "@/presentation/ui";

import { MarkdownEditorField } from "./markdown-editor-field";

const initialState: NoteActionState = {};

type NoteFormProps = {
  spacious?: boolean;
};

export function NoteForm({ spacious = false }: NoteFormProps) {
  const [state, action, pending] = useActionState(
    createTextNoteAction,
    initialState,
  );
  const [lastSavedState, setLastSavedState] = useState(state);
  const [formGeneration, setFormGeneration] = useState(0);

  // Once a save succeeds, remount the form so a second note starts empty
  // instead of stacking on top of the note that was just written.
  if (lastSavedState !== state) {
    setLastSavedState(state);

    if (state.message) {
      setFormGeneration((generation) => generation + 1);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <h2 className="text-base font-bold text-ink">Write a note</h2>
          <p className="mt-1 text-xs text-body">
            Capture a thought, summary, or reference in your own words.
          </p>
        </div>

        <form action={action} className="space-y-4" key={formGeneration}>
          <div className="space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              maxLength={200}
              name="title"
              placeholder="Enter a title for your note..."
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <MarkdownEditorField
              editorClassName={spacious ? "min-h-[360px]" : "min-h-56"}
              placeholder="Start writing your note..."
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
          <div className="flex justify-end">
            <Button
              disabled={pending}
              icon={<Save className="h-4 w-4" />}
              type="submit"
            >
              {pending ? "Processing note..." : "Save Note"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
