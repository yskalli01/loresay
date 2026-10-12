import Image from "next/image";
import type { HTMLAttributes } from "react";

import { cn } from "@/presentation/lib/utils";

export function BrandMark({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center rounded-lg bg-surface text-accent shadow-control ring-1 ring-border-subtle",
        className,
      )}
      {...props}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="h-full w-full object-contain"
        height={44}
        src="/brand/loresay-mark.png"
        width={44}
      />
    </span>
  );
}
