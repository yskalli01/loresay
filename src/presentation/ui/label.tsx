import type { LabelHTMLAttributes } from "react";

import { cn } from "@/presentation/lib/utils";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium leading-6 text-ink", className)}
      {...props}
    />
  );
}
