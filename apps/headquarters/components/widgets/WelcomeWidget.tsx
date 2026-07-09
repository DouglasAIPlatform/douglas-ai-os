import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export interface WelcomeWidgetProps extends WidgetStateProps {
  label: string;
  greeting: string;
  userName: string;
  message: string;
  footer?: string;
}

export function WelcomeWidget({
  label,
  greeting,
  userName,
  message,
  footer,
  isLoading,
  isEmpty,
  error,
}: WelcomeWidgetProps) {
  return (
    <WidgetFrame
      title={label}
      description="Resumo executivo para iniciar a operação."
      footer={footer}
      className="relative overflow-hidden"
      isLoading={isLoading}
      isEmpty={isEmpty}
      error={error}
      emptyTitle="Boas-vindas indisponíveis"
      emptyDescription="Assim que houver contexto do usuário, este widget será preenchido."
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--ds-color-surface)_0%,var(--ds-color-surface-muted)_56%,var(--ds-color-brand-accent-soft)_100%)]" />
      <div className="pointer-events-none absolute -right-[var(--ds-space-16)] -top-[var(--ds-space-16)] h-[12rem] w-[12rem] rounded-[var(--ds-radius-full)] bg-[var(--ds-background-orb-violet)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-[var(--ds-sidebar-width-collapsed)] left-1/4 h-[10rem] w-[10rem] rounded-[var(--ds-radius-full)] bg-[var(--ds-background-orb-sky)] blur-3xl" />

      <div className="relative">
        <h2 className="text-[length:var(--ds-font-size-3xl)] font-[var(--ds-font-weight-semibold)] leading-[var(--ds-line-height-heading)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-text-primary)] sm:text-[length:var(--ds-font-size-4xl)]">
          {greeting},{" "}
          <span className="bg-[image:var(--ds-gradient-focus)] bg-clip-text text-transparent">
            {userName}
          </span>{" "}
          <span aria-hidden className="inline-block">
            👋
          </span>
        </h2>
        <p className="mt-[var(--ds-space-3)] max-w-xl text-[length:var(--ds-font-size-md)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-secondary)]">
          {message}
        </p>
      </div>
    </WidgetFrame>
  );
}
