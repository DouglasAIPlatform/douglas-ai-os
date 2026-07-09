import { DashboardLayout, PageHeader } from "@douglas/ui";
import { PageBackground } from "@/components/decorative/PageBackground";
import { Footer } from "@/components/layout/Footer";
import type { AppRouteId } from "@/config/routes";
import { getRouteBreadcrumbs, getRouteById } from "@/config/routes";
import { CommandPaletteActions } from "@/features/command-palette/CommandPaletteActions";
import { BrainPanel } from "@/features/brain/BrainPanel";

interface BrainRoutePageProps {
  routeId: AppRouteId;
}

export function BrainRoutePage({ routeId }: BrainRoutePageProps) {
  const route = getRouteById(routeId);

  return (
    <DashboardLayout
      background={<PageBackground />}
      header={
        <PageHeader
          eyebrow="Douglas AI OS"
          title={route.title}
          subtitle={route.subtitle}
          breadcrumbs={getRouteBreadcrumbs(routeId)}
          actions={<CommandPaletteActions />}
        />
      }
      footer={<Footer />}
    >
      <BrainPanel />
    </DashboardLayout>
  );
}
