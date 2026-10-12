import type { HTMLAttributes } from "react";

import { cn } from "@/presentation/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border-subtle bg-surface shadow-card transition-[border-color,box-shadow,transform] duration-200",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-border-subtle px-4 py-3", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
