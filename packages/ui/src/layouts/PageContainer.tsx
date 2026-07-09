import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "default" | "wide" | "full";
}

const sizeStyles: Record<NonNullable<PageContainerProps["size"]>, string> = {
  default: "max-w-[var(--ds-grid-max-width)]",
  wide: "max-w-[calc(var(--ds-grid-max-width)+var(--ds-space-16))]",
  full: "max-w-none",
};

export function PageContainer({
  size = "default",
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-[var(--ds-grid-gutter-sm)] py-[var(--ds-space-8)] sm:px-[var(--ds-grid-gutter-md)] sm:py-[var(--ds-space-10)] lg:px-[var(--ds-grid-gutter-lg)]",
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
