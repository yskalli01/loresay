import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/presentation/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  danger:
    "bg-error text-white shadow-sm hover:bg-error/90 active:bg-error/80 disabled:bg-error/50",
  ghost:
    "bg-transparent text-body hover:bg-surface-subtle active:bg-accent-soft disabled:text-muted",
  primary:
    "bg-accent text-on-accent shadow-sm hover:bg-accent-strong active:bg-accent-strong disabled:bg-accent/50",
  secondary:
    "border border-border-subtle bg-surface-raised text-ink shadow-sm hover:border-border hover:bg-surface-subtle active:bg-accent-soft disabled:text-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  icon: "h-11 w-11 p-0",
  md: "h-11 px-4 text-sm",
  sm: "h-9 px-3 text-sm",
};

export function Button({
  className,
  icon,
  size = "md",
  type = "button",
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-70",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}
