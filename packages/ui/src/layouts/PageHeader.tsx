import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  toolbar?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  search?: ReactNode;
}

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-[var(--ds-space-3)]">
      <ol className="flex flex-wrap items-center gap-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-[var(--ds-space-2)]">
              {index > 0 ? (
                <span aria-hidden className="text-[var(--ds-color-text-subtle)]">
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <a
                  className="transition-colors duration-[var(--ds-duration-normal)] hover:text-[var(--ds-color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)]"
                  href={item.href}
                >
                  {item.label}
                </a>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
  toolbar,
  actions,
  filters,
  search,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-[var(--ds-space-8)] rounded-[var(--ds-radius-panel)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-glass)] p-[var(--ds-space-5)] shadow-[var(--ds-elevation-sm)] backdrop-blur-xl",
        className,
      )}
      {...props}
    >
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}

      <div className="flex flex-col gap-[var(--ds-space-5)] lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[length:var(--ds-font-size-2xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-[var(--ds-letter-spacing-brand)] text-[var(--ds-color-text-subtle)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] leading-[var(--ds-line-height-heading)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-text-primary)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-[var(--ds-space-2)] max-w-2xl text-[length:var(--ds-font-size-sm)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>

        {(toolbar || actions) && (
          <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
            {toolbar}
            {actions}
          </div>
        )}
      </div>

      {(search || filters || children) && (
        <div className="mt-[var(--ds-space-5)] flex flex-col gap-[var(--ds-space-3)] border-t border-[var(--ds-color-border-subtle)] pt-[var(--ds-space-5)] lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">{search}</div>
          {filters ? (
            <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
              {filters}
            </div>
          ) : null}
          {children}
        </div>
      )}
    </header>
  );
}
