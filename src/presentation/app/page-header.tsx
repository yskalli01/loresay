import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  badge: string;
  description: string;
  title: string;
};

export function PageHeader({ actions, description, title }: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-normal text-ink">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-body">{description}</p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
      ) : null}
    </section>
  );
}
