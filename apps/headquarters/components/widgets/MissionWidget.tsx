import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export interface MissionWidgetProps extends WidgetStateProps {
  mission: string | null;
  footer?: string;
}

function SparkIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-5)] w-[var(--ds-space-5)] text-[var(--ds-color-brand-accent)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
      />
    </svg>
  );
}

export function MissionWidget({
  mission,
  footer,
  isLoading,
  error,
}: MissionWidgetProps) {
  return (
    <WidgetFrame
      title="Missão do Dia"
      description="Foco estratégico para hoje"
      variant="featured"
      inverted
      className="relative h-full overflow-hidden"
      footer={footer}
      isLoading={isLoading}
      isEmpty={!mission}
      error={error}
      emptyTitle="Missão não definida"
      emptyDescription="A missão do dia será exibida quando houver planejamento disponível."
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--ds-color-border-inverse),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-[var(--ds-space-8)] -top-[var(--ds-space-8)] h-[calc(var(--ds-space-16)*2)] w-[calc(var(--ds-space-16)*2)] rounded-[var(--ds-radius-full)] bg-[var(--ds-color-brand-accent-soft)] blur-2xl" />

      <blockquote className="relative mt-[var(--ds-space-2)]">
        <SparkIcon />
        <p className="mt-[var(--ds-space-4)] text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-medium)] leading-[var(--ds-line-height-body)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-text-inverse)] sm:text-[length:var(--ds-font-size-xl)]">
          &ldquo;{mission}&rdquo;
        </p>
      </blockquote>
    </WidgetFrame>
  );
}
