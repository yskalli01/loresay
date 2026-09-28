import type { ReactNode } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";

import { Button } from "./button";

type StateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: StateProps) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface-raised px-5 py-10 text-center shadow-card">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-accent-tint text-accent">
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
      className="rounded-md border border-error/40 bg-error-soft px-5 py-4"
      role="alert"
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-error" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-error">{title}</h3>
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
      className="flex min-h-24 items-center justify-center gap-3 rounded-md border border-border-subtle bg-surface-raised text-sm text-body shadow-card"
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
