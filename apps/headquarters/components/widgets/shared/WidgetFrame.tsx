import { Card, SectionTitle, cn } from "@douglas/ui";
import type { CardVariant } from "@douglas/ui";
import type { ReactNode } from "react";

export interface WidgetStateProps {
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: string | null;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export interface WidgetFrameProps extends WidgetStateProps {
  title: string;
  description?: string;
  count?: number;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: CardVariant;
  hover?: boolean;
  inverted?: boolean;
}

export interface WidgetHeaderProps {
  title: string;
  description?: string;
  count?: number;
  inverted?: boolean;
}

export interface WidgetBodyProps extends WidgetStateProps {
  children: ReactNode;
  className?: string;
  inverted?: boolean;
}

export interface WidgetFooterProps {
  children?: ReactNode;
  className?: string;
  inverted?: boolean;
}

function WidgetLoadingState({
  label = "Carregando dados...",
  inverted = false,
}: {
  label?: string;
  inverted?: boolean;
}) {
  return (
    <div
      className="space-y-[var(--ds-space-3)]"
      aria-live="polite"
      aria-busy="true"
    >
      <p
        className={cn(
          "text-[length:var(--ds-font-size-sm)]",
          inverted
            ? "text-[var(--ds-color-text-subtle)]"
            : "text-[var(--ds-color-text-muted)]",
        )}
      >
        {label}
      </p>
      <div className="space-y-[var(--ds-space-2)]">
        <div
          className={cn(
            "h-[var(--ds-space-10)] animate-pulse rounded-[var(--ds-radius-md)]",
            inverted
              ? "bg-[var(--ds-color-border-inverse)]"
              : "bg-[var(--ds-color-surface-muted)]",
          )}
        />
        <div
          className={cn(
            "h-[var(--ds-space-10)] w-5/6 animate-pulse rounded-[var(--ds-radius-md)]",
            inverted
              ? "bg-[var(--ds-color-border-inverse)]"
              : "bg-[var(--ds-color-surface-muted)]",
          )}
        />
      </div>
    </div>
  );
}

function WidgetEmptyState({
  title = "Nenhum dado disponível",
  description = "Este widget está pronto para receber dados reais.",
  inverted = false,
}: {
  title?: string;
  description?: string;
  inverted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--ds-radius-md)] border border-dashed p-[var(--ds-space-4)]",
        inverted
          ? "border-[var(--ds-color-border-inverse)] bg-[var(--ds-color-border-inverse)]"
          : "border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)]",
      )}
    >
      <p
        className={cn(
          "text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)]",
          inverted
            ? "text-[var(--ds-color-text-inverse)]"
            : "text-[var(--ds-color-text-primary)]",
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)]",
          inverted
            ? "text-[var(--ds-color-text-subtle)]"
            : "text-[var(--ds-color-text-muted)]",
        )}
      >
        {description}
      </p>
    </div>
  );
}

function WidgetErrorState({
  error,
  inverted = false,
}: {
  error: string;
  inverted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--ds-radius-md)] border p-[var(--ds-space-4)]",
        inverted
          ? "border-[var(--ds-color-danger)] bg-[var(--ds-color-danger-soft)]"
          : "border-[var(--ds-color-danger)] bg-[var(--ds-color-danger-soft)]",
      )}
      role="alert"
    >
      <p
        className={cn(
          "text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-danger)]",
        )}
      >
        Não foi possível carregar este widget.
      </p>
      <p
        className={cn(
          "mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-danger)]",
        )}
      >
        {error}
      </p>
    </div>
  );
}

export function WidgetHeader({
  title,
  description,
  count,
  inverted = false,
}: WidgetHeaderProps) {
  return (
    <SectionTitle
      title={title}
      description={description}
      count={count}
      inverted={inverted}
    />
  );
}

export function WidgetBody({
  children,
  className,
  isLoading = false,
  isEmpty = false,
  error = null,
  loadingLabel,
  emptyTitle,
  emptyDescription,
  inverted = false,
}: WidgetBodyProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <WidgetLoadingState label={loadingLabel} inverted={inverted} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <WidgetErrorState error={error} inverted={inverted} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={className}>
        <WidgetEmptyState
          title={emptyTitle}
          description={emptyDescription}
          inverted={inverted}
        />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

export function WidgetFooter({
  children,
  className,
  inverted = false,
}: WidgetFooterProps) {
  if (!children) return null;

  return (
    <footer
      className={cn(
        "mt-[var(--ds-space-6)] border-t pt-[var(--ds-space-4)] text-[length:var(--ds-font-size-xs)]",
        inverted
          ? "border-[var(--ds-color-border-inverse)] text-[var(--ds-color-text-subtle)]"
          : "border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-subtle)]",
        className,
      )}
    >
      {children}
    </footer>
  );
}

export function WidgetFrame({
  title,
  description,
  count,
  footer,
  children,
  className,
  bodyClassName,
  variant = "default",
  hover = true,
  inverted = false,
  isLoading,
  isEmpty,
  error,
  loadingLabel,
  emptyTitle,
  emptyDescription,
}: WidgetFrameProps) {
  return (
    <Card variant={variant} hover={hover} className={className}>
      <WidgetHeader
        title={title}
        description={description}
        count={count}
        inverted={inverted}
      />
      <WidgetBody
        className={bodyClassName}
        isLoading={isLoading}
        isEmpty={isEmpty}
        error={error}
        loadingLabel={loadingLabel}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        inverted={inverted}
      >
        {children}
      </WidgetBody>
      <WidgetFooter inverted={inverted}>{footer}</WidgetFooter>
    </Card>
  );
}
