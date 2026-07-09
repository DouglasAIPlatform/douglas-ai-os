import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type CardVariant = "default" | "elevated" | "featured";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface)] shadow-[var(--ds-elevation-sm)]",
  elevated:
    "border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] shadow-[var(--ds-elevation-md)]",
  featured:
    "border-[var(--ds-color-border-inverse)] bg-[var(--ds-color-surface-inverse)] text-[var(--ds-color-text-inverse)] shadow-[var(--ds-elevation-featured)]",
};

export function Card({
  variant = "default",
  hover = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--ds-radius-2xl)] border p-[var(--ds-space-6)] transition-all duration-[var(--ds-duration-slow)] ease-[var(--ds-ease-standard)]",
        variantStyles[variant],
        hover &&
          variant !== "featured" &&
          "hover:-translate-y-[var(--ds-state-hover-transform)] hover:border-[var(--ds-color-border-strong)] hover:shadow-[var(--ds-elevation-md)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
