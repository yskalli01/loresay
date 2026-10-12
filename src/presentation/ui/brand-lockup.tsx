import Image from "next/image";
import type { HTMLAttributes } from "react";

import { cn } from "@/presentation/lib/utils";

export function BrandLockup({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex h-11 w-44 items-center", className)}
      {...props}
    >
      <Image
        alt="Loresay"
        className="h-full w-full object-contain object-left"
        height={523}
        priority
        src="/brand/loresay-lockup.png"
        width={2172}
      />
    </span>
  );
}
