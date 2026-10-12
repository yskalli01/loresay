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
        "h-11 w-full rounded-sm border bg-surface-raised px-3 text-sm text-ink shadow-control transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted sm:h-10",
        invalid
          ? "border-error focus:border-error focus:ring-error/20"
          : "border-border-subtle",
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
        "min-h-28 w-full resize-y rounded-sm border bg-surface-raised px-3 py-2 text-sm leading-6 text-ink shadow-control transition placeholder:text-muted hover:border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted",
        invalid
          ? "border-error focus:border-error focus:ring-error/20"
          : "border-border-subtle",
        className,
      )}
      {...props}
    />
  );
}
