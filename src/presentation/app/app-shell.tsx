import Link from "next/link";
import { BrainCircuit, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/presentation/lib/utils";
import { Badge, Sheet } from "@/presentation/ui";

import { navigationItems, type NavigationItem } from "./navigation";

type AppShellProps = {
  children: ReactNode;
  activePath?: string;
};

function NavLink({
  activePath,
  item,
  compact = false,
}: {
  activePath: string;
  item: NavigationItem;
  compact?: boolean;
}) {
  const isActive =
    item.href === activePath ||
    (item.href !== "/" && activePath.startsWith(`${item.href}/`));
  const Icon = item.icon;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
        isActive
          ? "bg-accent text-on-accent shadow-sm"
          : "text-body hover:bg-surface-subtle hover:text-ink",
        compact && "justify-between",
      )}
      href={item.href}
    >
      <span className="flex items-center gap-3">
        <Icon
          className={cn(
            "h-5 w-5 transition",
            isActive ? "text-on-accent" : "text-muted group-hover:text-accent",
          )}
          aria-hidden="true"
        />
        {item.label}
      </span>
      {item.status === "planned" && !isActive ? (
        <Badge className="hidden sm:inline-flex">soon</Badge>
      ) : null}
      {compact ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : null}
    </Link>
  );
}

function NavigationList({ activePath }: { activePath: string }) {
  return (
    <ul className="space-y-1">
      {navigationItems.map((item) => (
        <li key={item.href}>
          <NavLink activePath={activePath} item={item} />
        </li>
      ))}
    </ul>
  );
}

export function AppShell({ activePath = "/", children }: AppShellProps) {
  return (
    <div className="min-h-screen text-ink">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-accent focus:shadow-panel"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link
            className="flex min-h-11 items-center gap-2 font-semibold"
            href="/"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-on-accent shadow-sm">
              <BrainCircuit className="h-5 w-5" aria-hidden="true" />
            </span>
            AI Knowledge
          </Link>
          <Sheet label="Menu">
            <nav aria-label="Mobile navigation">
              <ul className="space-y-1">
                {navigationItems.map((item) => (
                  <li key={item.href}>
                    <NavLink activePath={activePath} compact item={item} />
                  </li>
                ))}
              </ul>
            </nav>
          </Sheet>
        </div>
      </header>

      <div className="mx-auto grid min-h-screen w-full max-w-[1480px] md:grid-cols-[292px_1fr]">
        <aside className="hidden border-r border-border-subtle bg-surface/90 px-4 py-6 shadow-card backdrop-blur md:block">
          <div className="sticky top-6">
            <Link
              className="flex min-h-12 items-center gap-3 rounded-md px-2 transition hover:bg-surface-subtle"
              href="/"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-on-accent shadow-sm">
                <BrainCircuit className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">
                  AI Knowledge
                </span>
                <span className="block text-xs text-muted">
                  Private workspace
                </span>
              </span>
            </Link>
            <nav aria-label="Primary navigation" className="mt-7">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Workspace
              </p>
              <div className="mt-3">
                <NavigationList activePath={activePath} />
              </div>
            </nav>
            <section
              aria-labelledby="shell-status-title"
              className="mt-8 rounded-md border border-border-subtle bg-accent-tint p-4"
            >
              <Badge tone="accent">Live MVP</Badge>
              <h2
                className="mt-3 text-sm font-semibold text-ink"
                id="shell-status-title"
              >
                Workspace status
              </h2>
              <p className="mt-2 text-sm leading-6 text-body">
                Capture, ingestion, source management, and grounded chat now
                have focused pages.
              </p>
            </section>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
