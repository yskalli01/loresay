import type { ReactNode } from "react";

import { Card } from "@/presentation/ui";

export function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-body">{detail}</p>
    </Card>
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
    <div className="rounded-md border border-border-subtle bg-surface-subtle p-3">
      <div className="flex items-center gap-2 text-muted">
        <span aria-hidden="true">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
