import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/presentation/lib/utils";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  danger:
    "bg-error text-on-error shadow-control hover:bg-error-strong active:bg-error-strong disabled:bg-error-soft disabled:text-error/50",
  ghost:
    "bg-transparent text-body hover:bg-surface-subtle hover:text-ink active:bg-accent-tint disabled:text-muted",
  primary:
    "bg-accent text-on-accent shadow-control hover:bg-accent-strong active:bg-accent-strong disabled:bg-accent-soft disabled:text-white/80",
  secondary:
    "border border-border-subtle bg-surface-raised text-ink shadow-control hover:border-border hover:bg-surface-subtle active:bg-accent-tint disabled:bg-surface-subtle disabled:text-muted",
  tertiary:
    "bg-transparent text-accent hover:bg-accent-tint active:bg-accent-soft disabled:text-accent-light",
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
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-80",
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
