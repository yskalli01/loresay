/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ChevronRight,
  LogOut,
  Search,
  Settings,
  Trash2,
  UserCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { signOut } from "@/app/auth/actions";
import { requireSessionUser } from "@/infrastructure/auth/session";
import { knowledgeRepository } from "@/infrastructure/db/knowledge-repository";
import { createAvatarSignedUrl } from "@/infrastructure/supabase/account-storage";
import { cn } from "@/presentation/lib/utils";
import { BrandLockup, Sheet } from "@/presentation/ui";

import { navigationItems, type NavigationItem } from "./navigation";
import { ThemeToggle } from "./theme-toggle";

type AppShellProps = {
  children: ReactNode;
  activePath?: string;
};

type AccountSummary = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
};

function initialsForAccount(account: AccountSummary) {
  return (account.displayName || account.email || "U")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function getAccountSummary(): Promise<AccountSummary> {
  const user = await requireSessionUser();
  const profile = await knowledgeRepository.getProfile({
    owner: { userId: user.id },
  });
  const email = user.email ?? "";
  const displayName = profile?.displayName || email.split("@")[0] || "Account";
  const avatarUrl = await createAvatarSignedUrl(
    profile?.avatarStoragePath ?? null,
  );

  return { avatarUrl, displayName, email };
}

function AccountAvatar({
  account,
  size = "sm",
}: {
  account: AccountSummary;
  size?: "sm" | "lg";
}) {
  const initials = initialsForAccount(account);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-accent-tint font-bold text-accent",
        size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-xs",
      )}
    >
      {account.avatarUrl ? (
        <img
          alt="Profile avatar"
          className="h-full w-full object-cover"
          src={account.avatarUrl}
        />
      ) : (
        initials || <UserCircle className="h-5 w-5" aria-hidden="true" />
      )}
    </span>
  );
}

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
        "group relative flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
        isActive
          ? "bg-surface text-accent-strong shadow-control ring-1 ring-border-subtle before:absolute before:left-0 before:top-2 before:h-6 before:w-1 before:rounded-full before:bg-accent"
          : "text-body hover:bg-surface-subtle hover:text-ink",
        compact && "justify-between text-sm",
      )}
      href={item.href}
    >
      <span className="flex items-center gap-2.5">
        <Icon
          className={cn(
            "h-4 w-4 transition",
            isActive ? "text-accent" : "text-muted group-hover:text-accent",
          )}
          aria-hidden="true"
        />
        {item.label}
      </span>
      {compact ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : null}
    </Link>
  );
}

function NavigationList({ activePath }: { activePath: string }) {
  return (
    <ul className="space-y-1">
      {navigationItems.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <NavLink activePath={activePath} item={item} />
        </li>
      ))}
    </ul>
  );
}

function TopSearch() {
  return (
    <label className="relative hidden min-w-0 flex-1 md:block">
      <span className="sr-only">Search your knowledge base</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        className="h-9 w-full max-w-[360px] rounded-sm border border-border-subtle bg-surface pl-8 pr-3 text-xs text-ink shadow-control transition placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        placeholder="Search your knowledge..."
        type="search"
      />
    </label>
  );
}

function HeaderActions({ account }: { account: AccountSummary }) {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <details className="group relative">
        <summary
          aria-label="Account"
          className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-body ring-1 ring-border-subtle transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 [&::-webkit-details-marker]:hidden"
        >
          <AccountAvatar account={account} />
        </summary>
        <div className="absolute right-0 top-11 z-30 w-72 rounded-lg border border-border-subtle bg-surface p-2 shadow-panel">
          <div className="flex items-center gap-3 border-b border-border-subtle px-2 pb-3 pt-2">
            <AccountAvatar account={account} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">
                {account.displayName}
              </p>
              <p className="truncate text-xs text-body">{account.email}</p>
            </div>
          </div>
          <div className="py-2">
            <Link
              className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-body transition hover:bg-accent-tint hover:text-accent"
              href="/account"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Account settings
            </Link>
            <Link
              className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-body transition hover:bg-surface-subtle hover:text-ink"
              href="/account#account-closure"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete account
            </Link>
          </div>
          <form action={signOut} className="border-t border-border-subtle pt-2">
            <button
              className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-error transition hover:bg-error-tint"
              type="submit"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}

export async function AppShell({ activePath = "/", children }: AppShellProps) {
  const account = await getAccountSummary();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-accent focus:shadow-panel"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link className="flex min-h-10 items-center gap-2 font-bold" href="/">
            <BrandLockup className="h-9 w-36" />
          </Link>
          <div className="flex items-center gap-2">
            <HeaderActions account={account} />
            <Sheet label="Menu">
              <nav aria-label="Mobile navigation">
                <ul className="space-y-1">
                  {navigationItems.map((item, index) => (
                    <li key={`${item.label}-${index}`}>
                      <NavLink activePath={activePath} compact item={item} />
                    </li>
                  ))}
                </ul>
              </nav>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] md:grid-cols-[216px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border-subtle bg-canvas px-4 py-5 md:block">
          <div className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col">
            <Link className="flex min-h-9 items-center gap-2" href="/">
              <BrandLockup className="h-8 w-32" />
            </Link>
            <nav aria-label="Primary navigation" className="mt-7">
              <NavigationList activePath={activePath} />
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-10 hidden h-14 items-center gap-4 border-b border-border-subtle bg-surface/90 px-5 backdrop-blur md:flex">
            <TopSearch />
            <HeaderActions account={account} />
          </header>
          <main
            className="surface-enter min-w-0 p-4 sm:p-5 lg:p-6"
            id="main-content"
          >
            <div className="mx-auto w-full max-w-[1360px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
