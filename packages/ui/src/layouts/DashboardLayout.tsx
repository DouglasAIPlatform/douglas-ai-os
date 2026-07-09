import type { ReactNode } from "react";
import { PageLayout } from "./PageLayout";
import type { PageLayoutProps } from "./PageLayout";

export interface DashboardLayoutProps
  extends Omit<PageLayoutProps, "className"> {
  background?: ReactNode;
  topBar?: ReactNode;
  className?: string;
}

export function DashboardLayout({
  background,
  topBar,
  header,
  footer,
  children,
  className,
  ...props
}: DashboardLayoutProps) {
  return (
    <>
      {background}
      {topBar}
      <PageLayout
        header={header}
        footer={footer}
        className={className}
        {...props}
      >
        {children}
      </PageLayout>
    </>
  );
}
