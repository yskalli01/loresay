import type { HTMLAttributes } from "react";

import { cn } from "@/presentation/lib/utils";

type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "collection"
  | "note"
  | "document"
  | "url"
  | "processing"
  | "completed"
  | "failed"
  | "archived";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  accent: "border-accent/15 bg-accent-tint text-accent-strong",
  archived: "border-border-subtle bg-surface-subtle text-muted",
  collection: "border-accent/15 bg-accent-tint text-accent-strong",
  completed: "border-success/15 bg-success-tint text-success-strong",
  document: "border-success/15 bg-success-tint text-success-strong",
  error: "border-error/15 bg-error-tint text-error-strong",
  failed: "border-error/15 bg-error-tint text-error-strong",
  info: "border-info/15 bg-info-tint text-info-strong",
  neutral: "border-border-subtle bg-surface-subtle text-body",
  note: "border-info/15 bg-info-tint text-info-strong",
  processing: "border-accent/15 bg-accent-tint text-accent-strong",
  success: "border-success/15 bg-success-tint text-success-strong",
  url: "border-warning/15 bg-warning-tint text-warning-strong",
  warning: "border-warning/15 bg-warning-tint text-warning-strong",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
