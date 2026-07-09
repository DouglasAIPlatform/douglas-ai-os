import { StatusBadge } from "@douglas/ui";
import { Avatar } from "@/components/ui/Avatar";
import { getAccentPalette } from "@/lib/visual-helpers";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export interface ProjectWidgetItem {
  id: string;
  name: string;
  status: string;
  description: string;
  progress?: number;
}

export interface ProjectsWidgetProps extends WidgetStateProps {
  projects: ProjectWidgetItem[];
  footer?: string;
}

export function ProjectsWidget({
  projects,
  footer,
  isLoading,
  error,
}: ProjectsWidgetProps) {
  return (
    <WidgetFrame
      title="Projetos Ativos"
      description="Iniciativas em andamento na plataforma"
      count={projects.length}
      footer={footer}
      className="h-full"
      isLoading={isLoading}
      isEmpty={projects.length === 0}
      error={error}
      emptyTitle="Nenhum projeto ativo"
      emptyDescription="Projetos aparecerão aqui quando forem adicionados à plataforma."
    >
      <ul className="space-y-3">
        {projects.map((project) => {
          const palette = getAccentPalette(project.name);
          const progress = project.progress ?? 66;

          return (
            <li
              key={project.id}
              className="group flex flex-col gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)] transition-colors duration-[var(--ds-duration-normal)] hover:border-[var(--ds-color-border-strong)] hover:bg-[var(--ds-color-surface)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-[var(--ds-space-3-5)]">
                <Avatar name={project.name} />
                <div className="min-w-0">
                  <p className="truncate text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
                    {project.name}
                  </p>
                  <p className="mt-[var(--ds-space-0-5)] truncate text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                    {project.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-[var(--ds-space-3)] sm:flex-col sm:items-end sm:gap-[var(--ds-space-2)]">
                <div
                  className="hidden h-[var(--ds-space-1)] w-[var(--ds-space-16)] overflow-hidden rounded-[var(--ds-radius-full)] bg-[var(--ds-color-border-default)] sm:block"
                  aria-hidden
                >
                  <div
                    className={`h-full rounded-[var(--ds-radius-full)] ${palette.bg}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <StatusBadge label={project.status} variant="development" />
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetFrame>
  );
}
