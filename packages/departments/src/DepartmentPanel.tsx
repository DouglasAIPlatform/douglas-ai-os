"use client";

import {
  DEPARTMENT_HEALTH_LABELS,
  DEPARTMENT_LABELS,
  DEPARTMENT_STATUS_LABELS,
} from "./DepartmentTypes";
import { useDepartments } from "./useDepartments";

interface DepartmentPanelProps {
  emptyMessage?: string;
}

export function DepartmentPanel({
  emptyMessage = "Nenhum departamento registrado.",
}: DepartmentPanelProps) {
  const { departments, healthReports, metricsSnapshots, manager } = useDepartments();

  if (!departments.length) {
    return (
      <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-[var(--ds-space-6)]">
      <div>
        <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
          Departamentos Inteligentes
        </p>
        <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {departments.length} departamento(s) — infraestrutura mockada.
        </p>
      </div>

      {departments.map((department) => {
        const health = healthReports.find(
          (report) => report.departmentId === department.id,
        );
        const metrics = metricsSnapshots.find(
          (snapshot) => snapshot.departmentId === department.id,
        );
        const agents = manager.getStore().getAgents(department.id);
        const tasks = manager.getStore().getTasks(department.id);
        const events = manager.getStore().getEvents(department.id);

        return (
          <article
            key={department.id}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]"
          >
            <div className="flex flex-col gap-[var(--ds-space-1)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
                  {DEPARTMENT_LABELS[department.id] ?? department.name}
                </p>
                <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  {department.description}
                </p>
              </div>
              <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
                {DEPARTMENT_STATUS_LABELS[department.status]}
                {health ? ` · ${DEPARTMENT_HEALTH_LABELS[health.status]}` : ""}
              </span>
            </div>

            <div className="mt-[var(--ds-space-4)] grid gap-[var(--ds-space-4)] lg:grid-cols-2">
              <InfoGroup
                title="Agentes"
                items={agents.map((entry) => entry.agentId)}
              />
              <InfoGroup
                title="Tarefas"
                items={tasks.map((task) => `${task.title} (${task.status})`)}
              />
              <InfoGroup title="Eventos" items={events.map((event) => event.topic)} />
              <InfoGroup
                title="Métricas"
                items={
                  metrics?.metrics.map(
                    (metric) => `${metric.label}: ${metric.value}`,
                  ) ?? []
                }
              />
            </div>
          </article>
        );
      })}
    </section>
  );
}

function InfoGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] uppercase tracking-[var(--ds-letter-spacing-wide)] text-[var(--ds-color-text-muted)]">
        {title}
      </p>
      {items.length ? (
        <ul className="mt-[var(--ds-space-2)] space-y-[var(--ds-space-1)]">
          {items.map((item) => (
            <li
              key={item}
              className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
          —
        </p>
      )}
    </div>
  );
}
