import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-[var(--ds-color-brand-primary)] bg-[var(--ds-color-brand-primary)] text-[var(--ds-color-text-inverse)] hover:bg-[var(--ds-color-brand-primary-hover)]",
  secondary:
    "border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-muted)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-state-overlay-hover)] hover:text-[var(--ds-color-text-primary)]",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--ds-radius-md)] px-[var(--ds-space-4)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] transition-colors duration-[var(--ds-duration-normal)] ease-[var(--ds-ease-standard)] focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)] disabled:pointer-events-none disabled:opacity-[var(--ds-state-disabled-opacity)]",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
