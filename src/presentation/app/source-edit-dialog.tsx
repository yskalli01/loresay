"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  updateKnowledgeSourceAction,
  type NoteActionState,
} from "@/app/actions/knowledge";
import { Button, FileUploadField, Input, Label } from "@/presentation/ui";

import { MarkdownEditorField } from "./markdown-editor-field";

type EditableSourceType = "document" | "note" | "url";

type SourceEditDialogProps = {
  body: string;
  sourceId: string;
  title: string;
  type: EditableSourceType;
  url?: string | null;
};

const initialState: NoteActionState = {};

export function SourceEditDialog(props: SourceEditDialogProps) {
  const [open, setOpen] = useState(false);
  const triggerId = `edit-source-${props.sourceId}`;

  const close = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() =>
      document.getElementById(triggerId)?.focus(),
    );
  }, [triggerId]);

  return (
    <>
      <Button
        icon={<Pencil className="h-4 w-4" />}
        id={triggerId}
        onClick={() => setOpen(true)}
        size="sm"
        variant="secondary"
      >
        Edit
      </Button>
      {open ? <SourceEditModal {...props} onClose={close} /> : null}
    </>
  );
}

function SourceEditModal({
  body,
  onClose,
  sourceId,
  title,
  type,
  url,
}: SourceEditDialogProps & { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (previousState: NoteActionState, formData: FormData) => {
      const nextState = await updateKnowledgeSourceAction(
        previousState,
        formData,
      );

      if (nextState.success) {
        startTransition(() => {
          onClose();
          router.refresh();
        });
      }

      return nextState;
    },
    initialState,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog
      ?.querySelector<HTMLElement>(
        "input:not([type='hidden']), textarea, [contenteditable='true']",
      )
      ?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]):not([type='hidden']), textarea:not([disabled]), [contenteditable='true'], [href]",
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const description =
    type === "note"
      ? "Update the title and note content. Saving creates a new searchable version."
      : type === "document"
        ? "Rename this source or choose a new text or Markdown file to replace its content."
        : "Rename this source or change its address to fetch and index the new page.";

  return (
    <div
      className="fixed inset-0 z-50 flex overflow-y-auto bg-ink/35 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-describedby="source-edit-description"
        aria-labelledby="source-edit-title"
        aria-modal="true"
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-border-subtle bg-surface shadow-panel sm:mx-auto sm:max-h-[calc(100dvh-3rem)]"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink" id="source-edit-title">
              Edit {sourceTypeLabel(type)}
            </h2>
            <p
              className="mt-1 max-w-2xl text-sm text-body"
              id="source-edit-description"
            >
              {description}
            </p>
          </div>
          <button
            aria-label="Close source editor"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-subtle hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form action={action} className="space-y-5 p-5">
          <input name="sourceId" type="hidden" value={sourceId} />
          <input name="sourceType" type="hidden" value={type} />

          <div className="space-y-2">
            <Label htmlFor={`source-title-${sourceId}`}>Title</Label>
            <Input
              autoComplete="off"
              defaultValue={title}
              id={`source-title-${sourceId}`}
              maxLength={200}
              name="title"
              required
            />
          </div>

          {type === "note" ? (
            <div className="space-y-2">
              <Label>Content</Label>
              <MarkdownEditorField
                defaultMarkdown={body}
                editorClassName="min-h-64"
                placeholder="Update note content..."
              />
            </div>
          ) : null}

          {type === "document" ? (
            <div className="space-y-2">
              <FileUploadField
                accept=".md,.markdown,.txt,text/markdown,text/plain"
                description="Plain text or Markdown up to 256 KB"
                id={`source-document-${sourceId}`}
                label="Choose a replacement file"
                name="document"
              />
            </div>
          ) : null}

          {type === "url" ? (
            <div className="space-y-2">
              <Label htmlFor={`source-url-${sourceId}`}>URL</Label>
              <Input
                defaultValue={url ?? ""}
                id={`source-url-${sourceId}`}
                name="url"
                required
                type="url"
              />
            </div>
          ) : null}

          {state.error ? (
            <p
              className="rounded-md border border-error/20 bg-error-tint px-3 py-2 text-sm font-medium text-error-strong"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-4">
            <Button
              disabled={pending}
              onClick={onClose}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              disabled={pending}
              icon={<Save className="h-4 w-4" />}
              type="submit"
            >
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function sourceTypeLabel(type: EditableSourceType) {
  if (type === "url") {
    return "URL";
  }

  return type === "note" ? "Note" : "Document";
}
