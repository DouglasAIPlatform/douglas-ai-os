import { cn } from "../lib/cn";

export interface SectionTitleProps {
  title: string;
  description?: string;
  count?: number;
  className?: string;
  inverted?: boolean;
}

export function SectionTitle({
  title,
  description,
  count,
  className,
  inverted = false,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "mb-[var(--ds-space-6)] flex items-start justify-between gap-[var(--ds-space-4)]",
        className,
      )}
    >
      <div>
        <h2
          className={cn(
            "text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-letter-spacing-tight)]",
            inverted
              ? "text-[var(--ds-color-text-inverse)]"
              : "text-[var(--ds-color-text-primary)]",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] leading-[var(--ds-line-height-body)]",
              inverted
                ? "text-[var(--ds-color-text-subtle)]"
                : "text-[var(--ds-color-text-muted)]",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {count !== undefined ? (
        <span
          className={cn(
            "shrink-0 rounded-[var(--ds-radius-full)] px-[var(--ds-space-2-5)] py-[var(--ds-space-0-5)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] tabular-nums",
            inverted
              ? "bg-[color:var(--ds-color-border-inverse)] text-[var(--ds-color-text-muted)]"
              : "bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-muted)]",
          )}
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}
