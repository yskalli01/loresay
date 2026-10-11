"use client";

import { useState } from "react";

import { cn } from "@/presentation/lib/utils";

import { ForwardRefMarkdownEditor } from "./forward-ref-markdown-editor";

export function normalizeEditorMarkdown(value: string) {
  return value.replace(/(?:&#x20;|&#32;|&nbsp;)/gi, " ");
}

export function MarkdownEditorField({
  className,
  defaultMarkdown = "",
  editorClassName,
  inputName = "body",
  maxLength = 20_000,
  placeholder = "Start writing your note...",
}: {
  className?: string;
  defaultMarkdown?: string;
  editorClassName?: string;
  inputName?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  const [markdown, setMarkdown] = useState(defaultMarkdown);

  return (
    <div className={cn("space-y-2", className)}>
      <textarea
        aria-hidden="true"
        className="sr-only"
        maxLength={maxLength}
        name={inputName}
        readOnly
        tabIndex={-1}
        value={markdown}
      />
      <ForwardRefMarkdownEditor
        className="knowledge-editor"
        contentEditableClassName={cn(
          "knowledge-editor-content",
          editorClassName,
        )}
        markdown={defaultMarkdown}
        onChange={(value) =>
          setMarkdown(normalizeEditorMarkdown(value).slice(0, maxLength))
        }
        placeholder={placeholder}
      />
      <p className="text-xs text-muted">
        Markdown is saved as plain text and processed for grounded answers.
      </p>
    </div>
  );
}
