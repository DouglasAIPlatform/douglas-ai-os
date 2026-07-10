import type { PlatformEnvironment } from "./PlatformEnvironment";

/** Políticas operacionais por ambiente — sem secrets nem URLs. */
export interface EnvironmentProfile {
  name: PlatformEnvironment;
  releaseChannel: string;
  allowMocks: boolean;
  allowMockRoleChange: boolean;
  allowLocalFallback: boolean;
  showDiagnosticTools: boolean;
  requireRealAuth: boolean;
  requireAuthProfile: boolean;
  requireEdgeFunctionAudit: boolean;
  requireReleaseReview: boolean;
  requireSensitiveActionConfirmation: boolean;
}

export const ENVIRONMENT_PROFILES: Record<PlatformEnvironment, EnvironmentProfile> = {
  development: {
    name: "development",
    releaseChannel: "dev",
    allowMocks: true,
    allowMockRoleChange: true,
    allowLocalFallback: true,
    showDiagnosticTools: true,
    requireRealAuth: false,
    requireAuthProfile: false,
    requireEdgeFunctionAudit: false,
    requireReleaseReview: false,
    requireSensitiveActionConfirmation: true,
  },
  staging: {
    name: "staging",
    releaseChannel: "staging",
    allowMocks: false,
    allowMockRoleChange: false,
    allowLocalFallback: false,
    showDiagnosticTools: true,
    requireRealAuth: true,
    requireAuthProfile: true,
    requireEdgeFunctionAudit: true,
    requireReleaseReview: false,
    requireSensitiveActionConfirmation: true,
  },
  production: {
    name: "production",
    releaseChannel: "production",
    allowMocks: false,
    allowMockRoleChange: false,
    allowLocalFallback: false,
    showDiagnosticTools: false,
    requireRealAuth: true,
    requireAuthProfile: true,
    requireEdgeFunctionAudit: true,
    requireReleaseReview: true,
    requireSensitiveActionConfirmation: true,
  },
};

export function getEnvironmentProfile(name: PlatformEnvironment): EnvironmentProfile {
  return { ...ENVIRONMENT_PROFILES[name] };
}
