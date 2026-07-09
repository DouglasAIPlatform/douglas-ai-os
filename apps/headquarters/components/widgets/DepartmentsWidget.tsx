import { StatusBadge } from "@douglas/ui";
import { Avatar } from "@/components/ui/Avatar";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export interface DepartmentWidgetItem {
  id: string;
  name: string;
  status: string;
}

export interface DepartmentsWidgetProps extends WidgetStateProps {
  departments: DepartmentWidgetItem[];
  footer?: string;
}

export function DepartmentsWidget({
  departments,
  footer,
  isLoading,
  error,
}: DepartmentsWidgetProps) {
  return (
    <WidgetFrame
      title="Departamentos"
      description="Equipes operacionais da empresa"
      count={departments.length}
      footer={footer}
      isLoading={isLoading}
      isEmpty={departments.length === 0}
      error={error}
      emptyTitle="Nenhum departamento cadastrado"
      emptyDescription="Departamentos serão exibidos quando houver dados operacionais."
    >
      <ul className="grid grid-cols-1 gap-[var(--ds-space-3)] sm:grid-cols-2 lg:grid-cols-4">
        {departments.map((department) => (
          <li
            key={department.id}
            className="group flex items-center justify-between gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3-5)] transition-all duration-[var(--ds-duration-normal)] hover:border-[var(--ds-color-border-strong)] hover:bg-[var(--ds-color-surface)] hover:shadow-[var(--ds-elevation-sm)]"
          >
            <div className="flex min-w-0 items-center gap-[var(--ds-space-3)]">
              <Avatar name={department.name} size="sm" />
              <span className="truncate text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                {department.name}
              </span>
            </div>
            <StatusBadge
              label={department.status}
              variant="online"
              className="shrink-0"
            />
          </li>
        ))}
      </ul>
    </WidgetFrame>
  );
}
