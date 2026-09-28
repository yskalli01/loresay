import type { DetailsHTMLAttributes, ReactNode } from "react";
import { Menu } from "lucide-react";

import { cn } from "@/presentation/lib/utils";

export type SheetProps = DetailsHTMLAttributes<HTMLDetailsElement> & {
  label: string;
  children: ReactNode;
};

export function Sheet({ className, label, children, ...props }: SheetProps) {
  return (
    <details className={cn("group relative", className)} {...props}>
      <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-md border border-border-subtle bg-surface px-3 text-sm font-medium text-ink marker:hidden hover:bg-surface-subtle">
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span>{label}</span>
      </summary>
      <div className="absolute right-0 top-12 z-20 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border-subtle bg-surface p-3 shadow-panel">
        {children}
      </div>
    </details>
  );
}
