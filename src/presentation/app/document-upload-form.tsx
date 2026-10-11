"use client";

import { useActionState } from "react";
import { UploadCloud } from "lucide-react";

import {
  createTextDocumentAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import { Button, Card, CardBody } from "@/presentation/ui";

const initialState: NoteActionState = {};

export function DocumentUploadForm() {
  const [state, action, pending] = useActionState(
    createTextDocumentAction,
    initialState,
  );

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <h2 className="text-base font-bold text-ink">Upload Document</h2>
          <p className="mt-1 text-xs text-body">
            Upload text or Markdown files to add to your knowledge base.
          </p>
        </div>
        <form action={action} className="space-y-4">
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-accent/40 bg-surface-raised px-5 text-center transition hover:bg-accent-tint/40">
            <UploadCloud className="h-8 w-8 text-accent" aria-hidden="true" />
            <span className="mt-3 text-sm font-bold text-ink">
              Drag and drop files here
            </span>
            <span className="mt-1 text-sm text-accent">or click to browse</span>
            <span className="mt-4 text-xs text-muted">
              Supported formats: .txt, .md, .markdown. Maximum file size: 256 KB
            </span>
            <input
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              className="sr-only"
              name="document"
              required
              type="file"
            />
          </label>
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
              icon={<UploadCloud className="h-4 w-4" />}
              type="submit"
            >
              {pending ? "Processing..." : "Upload Document"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
