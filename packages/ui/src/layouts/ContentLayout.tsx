import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ContentLayoutVariant = "stack" | "grid" | "sidebar";

export interface ContentLayoutProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ContentLayoutVariant;
}

const variantStyles: Record<ContentLayoutVariant, string> = {
  stack: "space-y-[var(--ds-space-6)] lg:space-y-[var(--ds-space-8)]",
  grid: "grid gap-[var(--ds-space-6)] lg:grid-cols-3 lg:gap-[var(--ds-space-8)]",
  sidebar:
    "grid gap-[var(--ds-space-6)] lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-[var(--ds-space-8)]",
};

export function ContentLayout({
  variant = "stack",
  className,
  children,
  ...props
}: ContentLayoutProps) {
  return (
    <section className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </section>
  );
}
