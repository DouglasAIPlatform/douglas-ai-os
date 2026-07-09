"use client";

import {
  DEMO_DATA_UNCONNECTED_DESCRIPTION,
  DEMO_DATA_UNCONNECTED_TITLE,
  useDemoData,
} from "@douglas/demo-data";
import { Card, StatusBadge } from "@douglas/ui";
import { useBrainDomains } from "./useBrain";

const domainLabels = [
  { key: "conversations", label: "Conversation" },
  { key: "agents", label: "Agent" },
  { key: "memories", label: "Memory" },
  { key: "prompts", label: "Prompt" },
  { key: "tasks", label: "Task" },
  { key: "decisions", label: "Decision" },
  { key: "knowledge", label: "Knowledge" },
] as const;

export function BrainOverview() {
  const { isSourceEnabled } = useDemoData();
  const brainMocksEnabled = isSourceEnabled("brain_mocks");
  const { brain, workspace } = useBrainDomains();

  if (!brainMocksEnabled) {
    return (
      <Card>
        <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-6)]">
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
            {DEMO_DATA_UNCONNECTED_TITLE}
          </p>
          <p className="mt-[var(--ds-space-2)] max-w-2xl text-[length:var(--ds-font-size-sm)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
            {DEMO_DATA_UNCONNECTED_DESCRIPTION}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-[var(--ds-space-4)]">
        <div>
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
            Douglas Brain
          </p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
            Núcleo da plataforma — infraestrutura pronta para IA futura.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
          <StatusBadge
            label={brain.isReady ? "Pronto" : "Inicializando"}
            variant={brain.isReady ? "available" : "neutral"}
          />
          {workspace.activeWorkspace ? (
            <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              Workspace: {workspace.activeWorkspace.name}
            </span>
          ) : null}
        </div>

        <div className="grid gap-[var(--ds-space-2)] sm:grid-cols-2 lg:grid-cols-4">
          {domainLabels.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]"
            >
              <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {label}
              </p>
              <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-semibold)] tabular-nums text-[var(--ds-color-text-primary)]">
                {brain.domainCounts[key]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
