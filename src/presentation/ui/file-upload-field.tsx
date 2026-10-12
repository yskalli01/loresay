"use client";

import {
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { ImagePlus, UploadCloud } from "lucide-react";

type FileUploadFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "type"
> & {
  description: string;
  label: string;
  kind?: "file" | "image";
};

export function FileUploadField({
  description,
  id,
  kind = "file",
  label,
  onChange,
  ...props
}: FileUploadFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [fileName, setFileName] = useState<string>();
  const Icon = kind === "image" ? ImagePlus : UploadCloud;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setFileName(event.target.files?.[0]?.name);
    onChange?.(event);
  }

  return (
    <label
      className="group flex min-h-20 cursor-pointer items-center gap-3 rounded-md border border-dashed border-border bg-surface-raised px-3 py-3 transition hover:border-accent hover:bg-accent-tint/30 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25"
      htmlFor={inputId}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-tint text-accent">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">
          {fileName ?? label}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted">
          {fileName ? "Ready to upload" : description}
        </span>
      </span>
      <span className="hidden shrink-0 rounded-md border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold text-body shadow-control sm:block">
        Browse
      </span>
      <input
        {...props}
        className="sr-only"
        id={inputId}
        onChange={handleChange}
        type="file"
      />
    </label>
  );
}
