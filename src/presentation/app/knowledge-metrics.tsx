import type { ReactNode } from "react";

export function MetricCard({
  detail,
  icon,
  label,
  value,
}: {
  detail: string;
  icon?: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 p-4">
      {icon ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-tint text-accent">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold tabular-nums text-ink">{value}</p>
          <p className="truncate text-sm font-semibold text-body">{label}</p>
        </div>
        <p className="truncate text-xs text-muted">{detail}</p>
      </div>
    </div>
  );
}

export function StatusCount({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-subtle p-3 ring-1 ring-border-subtle">
      <div className="flex items-center gap-2 text-muted">
        <span aria-hidden="true">{icon}</span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
