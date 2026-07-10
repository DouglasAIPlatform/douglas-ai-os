import type { EnvironmentConfig } from "./EnvironmentConfig";
import {
  evaluateEnvironmentSafety,
  type EnvironmentSafetyContext,
  type EnvironmentSafetyEvaluation,
} from "./EnvironmentSafetyPolicy";
import {
  isPlatformEnvironment,
  PLATFORM_ENVIRONMENT_VAR,
  type PlatformEnvironment,
} from "./PlatformEnvironment";
import { ENVIRONMENT_PROFILES } from "./EnvironmentProfile";

export type EnvironmentValidationSeverity = "error" | "warning";

export interface EnvironmentValidationIssue {
  severity: EnvironmentValidationSeverity;
  code: string;
  message: string;
}

export interface EnvironmentValidationResult {
  valid: boolean;
  environment: PlatformEnvironment;
  declaredExplicitly: boolean;
  issues: EnvironmentValidationIssue[];
  safety: EnvironmentSafetyEvaluation;
}

export function validateEnvironmentConfig(
  config: EnvironmentConfig,
  context: EnvironmentSafetyContext = {},
): EnvironmentValidationResult {
  const issues: EnvironmentValidationIssue[] = [];

  if (config.rawEnvironmentValue && !isPlatformEnvironment(config.rawEnvironmentValue)) {
    issues.push({
      severity: "warning",
      code: "invalid_environment_value",
      message: `Valor inválido em ${PLATFORM_ENVIRONMENT_VAR} — usando development.`,
    });
  }

  if (config.name === "production" && ENVIRONMENT_PROFILES.production.allowMocks) {
    issues.push({
      severity: "error",
      code: "production_mocks_enabled_in_policy",
      message: "Política de production não deve permitir mocks.",
    });
  }

  if (config.name === "staging" && ENVIRONMENT_PROFILES.staging.allowMocks) {
    issues.push({
      severity: "error",
      code: "staging_mocks_enabled_in_policy",
      message: "Política de staging não deve permitir mocks.",
    });
  }

  const safety = evaluateEnvironmentSafety(config, context);

  for (const message of safety.blockingIssues) {
    issues.push({
      severity: "error",
      code: "runtime_incompatible",
      message,
    });
  }

  for (const message of safety.warnings) {
    issues.push({
      severity: "warning",
      code: "runtime_warning",
      message,
    });
  }

  const hasErrors = issues.some((issue) => issue.severity === "error");

  return {
    valid: !hasErrors,
    environment: config.name,
    declaredExplicitly: config.declaredExplicitly,
    issues,
    safety,
  };
}

/** Snapshot seguro para widgets — sem URL, keys, UID ou e-mail. */
export interface EnvironmentStatusSnapshot {
  environment: PlatformEnvironment;
  environmentLabel: string;
  releaseChannel: string;
  declaredExplicitly: boolean;
  mocksAllowed: boolean;
  mockRoleChangeAllowed: boolean;
  supabaseConfigured: boolean;
  validationValid: boolean;
  incompatibleConfiguration: boolean;
  alerts: string[];
  readinessHint: string;
}

export function buildEnvironmentStatusSnapshot(input: {
  config: EnvironmentConfig;
  validation: EnvironmentValidationResult;
  supabaseConfigured: boolean;
}): EnvironmentStatusSnapshot {
  const { config, validation, supabaseConfigured } = input;
  const profile = config.profile;
  const alerts = validation.issues.map((issue) => issue.message);

  let readinessHint = "Ambiente local — mocks e fallback permitidos.";
  if (config.name === "staging") {
    readinessHint = "Staging — login real e profile operacional esperados.";
  }
  if (config.name === "production") {
    readinessHint = "Production — revisão de release e auth real obrigatórios.";
  }

  return {
    environment: config.name,
    environmentLabel: profile.releaseChannel,
    releaseChannel: profile.releaseChannel,
    declaredExplicitly: config.declaredExplicitly,
    mocksAllowed: profile.allowMocks,
    mockRoleChangeAllowed: profile.allowMockRoleChange,
    supabaseConfigured,
    validationValid: validation.valid,
    incompatibleConfiguration: !validation.safety.compatible,
    alerts,
    readinessHint,
  };
}

/** Input compacto para Production Safety Gate. */
export interface EnvironmentGateSnapshot {
  name: PlatformEnvironment;
  declaredExplicitly: boolean;
  allowMocks: boolean;
  allowMockRoleChange: boolean;
  requireAuthProfile: boolean;
  requireEdgeFunctionAudit: boolean;
  incompatible: boolean;
  validationValid: boolean;
}

export function toEnvironmentGateSnapshot(
  validation: EnvironmentValidationResult,
): EnvironmentGateSnapshot {
  const profile = ENVIRONMENT_PROFILES[validation.environment];
  return {
    name: validation.environment,
    declaredExplicitly: validation.declaredExplicitly,
    allowMocks: profile.allowMocks,
    allowMockRoleChange: profile.allowMockRoleChange,
    requireAuthProfile: profile.requireAuthProfile,
    requireEdgeFunctionAudit: profile.requireEdgeFunctionAudit,
    incompatible: !validation.safety.compatible,
    validationValid: validation.valid,
  };
}
