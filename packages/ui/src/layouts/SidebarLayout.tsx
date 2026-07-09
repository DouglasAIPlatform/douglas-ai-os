import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface SidebarLayoutProps {
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SidebarLayout({
  sidebar,
  children,
  className,
  contentClassName,
}: SidebarLayoutProps) {
  return (
    <div className={cn("min-h-screen", className)}>
      {sidebar}
      <main
        className={cn(
          "min-h-screen md:pl-[var(--ds-sidebar-width-collapsed)] lg:pl-[var(--ds-sidebar-width-expanded)]",
          contentClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
