import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  badge?: string;
  description: string;
  title: string;
};

export function PageHeader({ actions, description, title }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm leading-5 text-body">{description}</p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
