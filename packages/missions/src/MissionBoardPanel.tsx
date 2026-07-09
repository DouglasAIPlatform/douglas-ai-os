"use client";

import {
  MISSION_PRIORITY_LABELS,
  MISSION_SCOPE_LABELS,
  MISSION_STATUS_LABELS,
} from "./MissionTypes";
import { useMissions } from "./useMissions";

interface MissionBoardPanelProps {
  emptyMessage?: string;
}

export function MissionBoardPanel({
  emptyMessage = "Nenhuma missão no Mission Control.",
}: MissionBoardPanelProps) {
  const { board } = useMissions();

  if (!board.total) {
    return (
      <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-[var(--ds-space-4)]">
      <div>
        <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
          Mission Control
        </p>
        <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {board.total} missão(ões) · {board.activeCount} ativa(s) ·{" "}
          {board.completedCount} concluída(s)
        </p>
      </div>

      <div className="grid gap-[var(--ds-space-3)] lg:grid-cols-2 xl:grid-cols-4">
        {board.columns.map((column) => (
          <div
            key={column.status}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]"
          >
            <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] uppercase tracking-[var(--ds-letter-spacing-wide)] text-[var(--ds-color-text-muted)]">
              {column.label} ({column.missions.length})
            </p>

            <div className="mt-[var(--ds-space-3)] space-y-[var(--ds-space-2)]">
              {column.missions.length ? (
                column.missions.map((mission) => (
                  <article
                    key={mission.id}
                    className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)]"
                  >
                    <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
                      {mission.title}
                    </p>
                    <p className="mt-[var(--ds-space-1)] line-clamp-2 text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                      {mission.description}
                    </p>
                    <div className="mt-[var(--ds-space-2)] flex flex-wrap gap-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
                      <span>{MISSION_PRIORITY_LABELS[mission.priority]}</span>
                      <span>{mission.progress.percent}%</span>
                      {mission.execution.mode === "automatic" ? (
                        <span>auto</span>
                      ) : null}
                    </div>
                    {mission.scopes.length ? (
                      <div className="mt-[var(--ds-space-2)] flex flex-wrap gap-[var(--ds-space-1)]">
                        {mission.scopes.map((scope) => (
                          <span
                            key={`${scope.type}:${scope.refId}`}
                            className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]"
                          >
                            {MISSION_SCOPE_LABELS[scope.type]}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
                  —
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
