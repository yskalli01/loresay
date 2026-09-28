import type { HTMLAttributes } from "react";

import { cn } from "@/presentation/lib/utils";

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "error";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  accent: "border-accent/20 bg-accent-soft text-accent-strong",
  error: "border-error/20 bg-error-soft text-error",
  neutral: "border-border-subtle bg-surface-subtle text-body",
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/20 bg-warning-soft text-warning",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
