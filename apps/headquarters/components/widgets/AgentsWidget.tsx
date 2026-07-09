import { StatusBadge } from "@douglas/ui";
import { Avatar } from "@/components/ui/Avatar";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export interface AgentWidgetItem {
  id: string;
  name: string;
  status: string;
  role?: string;
}

export interface AgentsWidgetProps extends WidgetStateProps {
  agents: AgentWidgetItem[];
  footer?: string;
}

export function AgentsWidget({
  agents,
  footer,
  isLoading,
  error,
}: AgentsWidgetProps) {
  return (
    <WidgetFrame
      title="Agentes IA"
      description="Assistentes inteligentes prontos para operar"
      count={agents.length}
      footer={footer}
      isLoading={isLoading}
      isEmpty={agents.length === 0}
      error={error}
      emptyTitle="Nenhum agente disponível"
      emptyDescription="Agentes aparecerão aqui quando forem provisionados."
    >
      <ul className="grid grid-cols-1 gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((agent) => (
          <li
            key={agent.id}
            className="group flex items-center justify-between gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3-5)] transition-all duration-[var(--ds-duration-normal)] hover:border-[var(--ds-color-border-strong)] hover:bg-[var(--ds-color-surface)] hover:shadow-[var(--ds-elevation-sm)]"
          >
            <div className="flex min-w-0 items-center gap-[var(--ds-space-3)]">
              <Avatar name={agent.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                  {agent.name}
                </p>
                <p className="truncate text-[length:var(--ds-font-size-2xs)] text-[var(--ds-color-text-subtle)]">
                  {agent.role ?? "Agente IA"}
                </p>
              </div>
            </div>
            <StatusBadge
              label={agent.status}
              variant="available"
              className="shrink-0"
            />
          </li>
        ))}
      </ul>
    </WidgetFrame>
  );
}
