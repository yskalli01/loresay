import type { HTMLAttributes } from "react";

import { cn } from "@/presentation/lib/utils";

export function BrandMark({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent-tint text-accent shadow-control ring-1 ring-accent/15",
        className,
      )}
      {...props}
    >
      <span className="relative h-7 w-8" aria-hidden="true">
        <span className="absolute left-0 top-0 h-7 w-[15px] rounded-[5px] bg-gradient-to-br from-accent-light to-accent-strong shadow-sm" />
        <span className="absolute right-0 top-0 h-7 w-[15px] rounded-[5px] bg-gradient-to-br from-accent to-accent-strong shadow-sm" />
        <span className="absolute left-[14px] top-1 h-6 w-1 rounded-full bg-white/70" />
        <span className="absolute bottom-0 left-1 h-1.5 w-6 rounded-full bg-accent-strong/35 blur-[1px]" />
      </span>
    </span>
  );
}
