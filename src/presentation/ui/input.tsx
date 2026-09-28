import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/presentation/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ className, invalid = false, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-md border bg-surface-raised px-3 text-sm text-ink shadow-sm transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted",
        invalid ? "border-error" : "border-border-subtle",
        className,
      )}
      {...props}
    />
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({
  className,
  invalid = false,
  ...props
}: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-28 w-full resize-y rounded-md border bg-surface-raised px-3 py-2 text-sm leading-6 text-ink shadow-sm transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted",
        invalid ? "border-error" : "border-border-subtle",
        className,
      )}
      {...props}
    />
  );
}
