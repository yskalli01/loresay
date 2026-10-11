import type { ReactNode } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";

import { Button } from "./button";

export type StateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: StateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-raised px-5 py-10 text-center shadow-card">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-accent-tint text-accent ring-1 ring-accent/15">
        <Search className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-body">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description, action }: StateProps) {
  return (
    <div
      className="rounded-lg border border-error/20 bg-error-tint px-5 py-4"
      role="alert"
    >
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error text-on-error">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-error-strong">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-body">{description}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex min-h-24 items-center justify-center gap-3 rounded-lg border border-border-subtle bg-surface-raised text-sm text-body shadow-card"
      role="status"
    >
      <Loader2
        className="h-5 w-5 animate-spin text-accent"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

export function RetryButton() {
  return <Button variant="secondary">Try again</Button>;
}
