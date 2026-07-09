import type {
  CommandCenterDiagnosticsInput,
  CommandCenterPlatformInput,
  OperationalStatus,
} from "./OperationalCommandCenterTypes";
import { HEALTH_STATUS_LABELS } from "./OperationalCommandCenterTypes";

export function buildOperationalStatus(
  platform: CommandCenterPlatformInput,
  diagnostics: CommandCenterDiagnosticsInput | null,
): OperationalStatus {
  const healthStatus = platform.healthStatus ?? "unknown";

  return {
    overallStatus: platform.overallStatus,
    readinessScore: diagnostics?.score ?? platform.readinessScore,
    readinessLevel: platform.readinessLevel,
    platformReady: diagnostics?.ready ?? platform.platformReady,
    readyModules: platform.readyModules,
    alertModules: platform.alertModules,
    criticalModules: platform.criticalModules,
    offlineModules: platform.offlineModules,
    loadedModules: platform.loadedModules,
    healthStatus,
    healthLabel: HEALTH_STATUS_LABELS[healthStatus] ?? healthStatus,
    diagnosticsStatus: diagnostics?.status,
    diagnosticsScore: diagnostics?.score,
    diagnosticsReady: diagnostics?.ready,
    diagnosticsGeneratedAt: diagnostics?.generatedAt,
    blockers: platform.blockers,
    generatedAt: platform.generatedAt,
  };
}
