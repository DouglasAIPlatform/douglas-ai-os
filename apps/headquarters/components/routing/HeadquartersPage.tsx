import { Card, DashboardLayout, PageHeader } from "@douglas/ui";
import { PageBackground } from "@/components/decorative/PageBackground";
import { Footer } from "@/components/layout/Footer";
import { SystemStatusWidget } from "@/components/widgets/SystemStatusWidget";
import { RuntimeDashboardWidget } from "@/components/widgets/RuntimeDashboardWidget";
import { RuntimeControlWidget } from "@/components/widgets/RuntimeControlWidget";
import { HealthDashboardWidget } from "@/components/widgets/HealthDashboardWidget";
import { DependencyGraphWidget } from "@/components/widgets/DependencyGraphWidget";
import { LiveEventMonitorWidget } from "@/components/widgets/LiveEventMonitorWidget";
import { BootDiagnosticsWidget } from "@/components/widgets/BootDiagnosticsWidget";
import { AuditTrailWidget } from "@/components/widgets/AuditTrailWidget";
import { AuditIngestObservabilityWidget } from "@/components/widgets/AuditIngestObservabilityWidget";
import { SupabaseConnectionWidget } from "@/components/widgets/SupabaseConnectionWidget";
import { SupabaseValidationWidget } from "@/components/widgets/SupabaseValidationWidget";
import { ProductionSafetyWidget } from "@/components/widgets/ProductionSafetyWidget";
import { EnvironmentStatusWidget } from "@/components/widgets/EnvironmentStatusWidget";
import { StagingReadinessWidget } from "@/components/widgets/StagingReadinessWidget";
import { ReleaseStatusWidget } from "@/components/widgets/ReleaseStatusWidget";
import { AuthStatusWidget } from "@/components/widgets/AuthStatusWidget";
import { OperatorProfileBootstrapWidget } from "@/components/widgets/OperatorProfileBootstrapWidget";
import { MissionExecutionWidget } from "@/components/widgets/MissionExecutionWidget";
import { UnifiedPlatformStatusWidget } from "@/components/widgets/UnifiedPlatformStatusWidget";
import { getRouteBreadcrumbs, getRouteById } from "@/config/routes";
import { CommandPaletteActions } from "@/features/command-palette/CommandPaletteActions";

export function HeadquartersPage() {
  const route = getRouteById("headquarters");
  const breadcrumbs = getRouteBreadcrumbs("headquarters");

  return (
    <DashboardLayout
      background={<PageBackground />}
      header={
        <PageHeader
          eyebrow="Douglas AI OS"
          title={route.title}
          subtitle={route.subtitle}
          breadcrumbs={breadcrumbs}
          actions={<CommandPaletteActions />}
        />
      }
      footer={<Footer />}
    >
      <div className="grid gap-[var(--ds-space-4)] lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <UnifiedPlatformStatusWidget />
        </Card>
        <Card>
          <SystemStatusWidget />
        </Card>
        <Card>
          <RuntimeDashboardWidget />
        </Card>
        <Card className="lg:col-span-2">
          <RuntimeControlWidget />
        </Card>
        <Card className="lg:col-span-2">
          <MissionExecutionWidget />
        </Card>
        <Card className="lg:col-span-2">
          <HealthDashboardWidget />
        </Card>
        <Card className="lg:col-span-2">
          <DependencyGraphWidget />
        </Card>
        <Card className="lg:col-span-2">
          <LiveEventMonitorWidget />
        </Card>
        <Card className="lg:col-span-2">
          <BootDiagnosticsWidget />
        </Card>
        <Card className="lg:col-span-2">
          <AuditTrailWidget />
        </Card>
        <Card className="lg:col-span-2">
          <AuditIngestObservabilityWidget />
        </Card>
        <Card className="lg:col-span-2">
          <SupabaseValidationWidget />
        </Card>
        <Card className="lg:col-span-2">
          <EnvironmentStatusWidget />
        </Card>
        <Card className="lg:col-span-2">
          <StagingReadinessWidget />
        </Card>
        <Card className="lg:col-span-2">
          <ReleaseStatusWidget />
        </Card>
        <Card className="lg:col-span-2">
          <ProductionSafetyWidget />
        </Card>
        <Card className="lg:col-span-2">
          <SupabaseConnectionWidget />
        </Card>
        <Card className="lg:col-span-2">
          <AuthStatusWidget />
        </Card>
        <Card className="lg:col-span-2">
          <OperatorProfileBootstrapWidget />
        </Card>
      </div>
    </DashboardLayout>
  );
}
