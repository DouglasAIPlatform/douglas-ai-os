import { cn } from "../lib/cn";

export type StatusBadgeVariant =
  | "online"
  | "available"
  | "development"
  | "neutral";

export interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
  pulse?: boolean;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  online:
    "bg-[var(--ds-color-success-soft)] text-[var(--ds-color-success)] ring-[var(--ds-color-success-soft)]",
  available:
    "bg-[var(--ds-color-success-soft)] text-[var(--ds-color-success)] ring-[var(--ds-color-success-soft)]",
  development:
    "bg-[var(--ds-color-warning-soft)] text-[var(--ds-color-warning)] ring-[var(--ds-color-warning-soft)]",
  neutral:
    "bg-[var(--ds-state-overlay-hover)] text-[var(--ds-color-text-muted)] ring-[var(--ds-color-border-default)]",
};

const dotStyles: Record<StatusBadgeVariant, string> = {
  online: "bg-[var(--ds-color-success)] shadow-[var(--ds-shadow-status-success)]",
  available:
    "bg-[var(--ds-color-success)] shadow-[var(--ds-shadow-status-success)]",
  development: "bg-[var(--ds-color-warning)]",
  neutral: "bg-[var(--ds-color-text-subtle)]",
};

export function StatusBadge({
  label,
  variant = "neutral",
  className,
  pulse = false,
}: StatusBadgeProps) {
  const shouldPulse =
    pulse || variant === "online" || variant === "available";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[var(--ds-space-1-5)] rounded-[var(--ds-radius-full)] px-[var(--ds-space-2-5)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-2xs)] font-[var(--ds-font-weight-medium)] tracking-[var(--ds-letter-spacing-wide)] ring-1 ring-inset",
        variantStyles[variant],
        className,
      )}
    >
      <span
        className={cn(
          "h-[var(--ds-space-1-5)] w-[var(--ds-space-1-5)] rounded-[var(--ds-radius-full)]",
          dotStyles[variant],
          shouldPulse && "ds-animate-pulse-soft",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
