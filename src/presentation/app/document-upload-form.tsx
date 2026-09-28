"use client";

import { useActionState } from "react";
import { FileUp } from "lucide-react";

import {
  createTextDocumentAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import { Button, Card, CardBody, Input, Label } from "@/presentation/ui";

const initialState: NoteActionState = {};

export function DocumentUploadForm() {
  const [state, action, pending] = useActionState(
    createTextDocumentAction,
    initialState,
  );

  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Upload a document
          </h2>
          <p className="mt-1 text-sm leading-6 text-body">
            Deadline mode supports .txt and .md files up to 256 KB.
          </p>
        </div>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-upload">Document</Label>
            <Input
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              id="document-upload"
              name="document"
              required
              type="file"
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
            icon={<FileUp className="h-4 w-4" />}
            type="submit"
            variant="secondary"
          >
            {pending ? "Processing document..." : "Upload and process"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
