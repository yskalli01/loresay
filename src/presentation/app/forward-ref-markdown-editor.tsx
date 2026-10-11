"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";

const Editor = dynamic(() => import("./initialized-markdown-editor"), {
  loading: () => (
    <div className="flex min-h-56 items-center justify-center rounded-md border border-border-subtle bg-surface-raised text-sm text-muted">
      Loading editor...
    </div>
  ),
  ssr: false,
});

export const ForwardRefMarkdownEditor = forwardRef<
  MDXEditorMethods,
  MDXEditorProps
>((props, ref) => <Editor {...props} editorRef={ref} />);

ForwardRefMarkdownEditor.displayName = "ForwardRefMarkdownEditor";
