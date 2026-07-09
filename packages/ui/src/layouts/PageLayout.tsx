import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { PageContainer } from "./PageContainer";
import type { PageContainerProps } from "./PageContainer";

export interface PageLayoutProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  containerSize?: PageContainerProps["size"];
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
}

export function PageLayout({
  header,
  footer,
  children,
  containerSize = "default",
  className,
  containerClassName,
  contentClassName,
}: PageLayoutProps) {
  return (
    <div className={cn("relative min-h-screen", className)}>
      <PageContainer size={containerSize} className={containerClassName}>
        {header}
        <div className={contentClassName}>{children}</div>
        {footer}
      </PageContainer>
    </div>
  );
}
