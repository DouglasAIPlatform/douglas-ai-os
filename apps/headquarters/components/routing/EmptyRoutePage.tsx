import { Card, DashboardLayout, PageHeader } from "@douglas/ui";
import { PageBackground } from "@/components/decorative/PageBackground";
import { Footer } from "@/components/layout/Footer";
import type { AppRouteId } from "@/config/routes";
import { getRouteBreadcrumbs, getRouteById } from "@/config/routes";
import { CommandPaletteActions } from "@/features/command-palette/CommandPaletteActions";

interface EmptyRoutePageProps {
  routeId: AppRouteId;
}

export function EmptyRoutePage({ routeId }: EmptyRoutePageProps) {
  const route = getRouteById(routeId);
  const breadcrumbs = getRouteBreadcrumbs(routeId);

  return (
    <DashboardLayout
      background={<PageBackground />}
      header={
        <PageHeader
          eyebrow="Douglas AI OS"
          title={route.title}
          subtitle={route.subtitle}
          breadcrumbs={breadcrumbs}
          search={<RouteSearchPlaceholder />}
          filters={<RouteFilterPlaceholder />}
          actions={<CommandPaletteActions />}
        />
      }
      footer={<Footer />}
    >
      <Card>
        <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-6)]">
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
            Página preparada para evolução.
          </p>
          <p className="mt-[var(--ds-space-2)] max-w-2xl text-[length:var(--ds-font-size-sm)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
            A rota <span className="font-[var(--ds-font-weight-medium)]">{route.path}</span>{" "}
            já está registrada na arquitetura central e pronta para receber módulos,
            widgets e dados reais em sprints futuras.
          </p>
        </div>
      </Card>
    </DashboardLayout>
  );
}

function RouteSearchPlaceholder() {
  return (
    <div
      aria-label="Pesquisa preparada"
      role="search"
      className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-subtle)]"
    >
      Pesquisa global preparada
    </div>
  );
}

function RouteFilterPlaceholder() {
  return (
    <div className="rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-1-5)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
      Filtros preparados
    </div>
  );
}

