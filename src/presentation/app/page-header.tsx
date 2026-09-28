import type { ReactNode } from "react";

import { Badge } from "@/presentation/ui";

type PageHeaderProps = {
  actions?: ReactNode;
  badge: string;
  description: string;
  title: string;
};

export function PageHeader({
  actions,
  badge,
  description,
  title,
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-md border border-border-subtle bg-surface p-5 shadow-panel">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-accent"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge tone="accent">{badge}</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-ink">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-body">
            {description}
          </p>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}
