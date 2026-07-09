import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TopBarLayoutProps {
  leading?: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  sticky?: boolean;
  className?: string;
}

export function TopBarLayout({
  leading,
  center,
  trailing,
  children,
  sticky = true,
  className,
}: TopBarLayoutProps) {
  return (
    <div
      className={cn(
        "z-40 border-b border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-canvas)]/85 px-[var(--ds-space-4)] py-[var(--ds-space-3)] backdrop-blur-xl",
        sticky && "sticky top-0",
        className,
      )}
    >
      <div className="flex min-h-[var(--ds-space-10)] items-center justify-between gap-[var(--ds-space-4)]">
        <div className="flex min-w-0 items-center gap-[var(--ds-space-3)]">
          {leading}
        </div>
        {center ? <div className="hidden min-w-0 flex-1 md:block">{center}</div> : null}
        <div className="flex items-center gap-[var(--ds-space-2)]">{trailing}</div>
      </div>
      {children}
    </div>
  );
}
