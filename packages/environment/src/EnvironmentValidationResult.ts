import type { EnvironmentConfig } from "./EnvironmentConfig";
import {
  evaluateEnvironmentSafety,
  type EnvironmentSafetyContext,
  type EnvironmentSafetyEvaluation,
} from "./EnvironmentSafetyPolicy";
import {
  isPlatformEnvironment,
  PLATFORM_ENVIRONMENT_LABELS,
  PLATFORM_ENVIRONMENT_VAR,
  type PlatformEnvironment,
} from "./PlatformEnvironment";
import { ENVIRONMENT_PROFILES } from "./EnvironmentProfile";
import { resolveCanonicalEnvironment } from "./CanonicalEnvironmentResolver";
import { buildEnvironmentCompatibilityReport } from "./EnvironmentCompatibilityReport";
import { ENVIRONMENT_SOURCE_LABELS, type EnvironmentSource } from "./EnvironmentSource";
import type { DetectedEnvironmentSource } from "./EnvironmentResolution";

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
  options: { env?: NodeJS.ProcessEnv } = {},
): EnvironmentValidationResult {
  const issues: EnvironmentValidationIssue[] = [];
  const resolution = resolveCanonicalEnvironment(options);
  const compatibility = buildEnvironmentCompatibilityReport(resolution);

  if (config.rawEnvironmentValue && !isPlatformEnvironment(config.rawEnvironmentValue)) {
    issues.push({
      severity: "warning",
      code: "invalid_environment_value",
      message: `Valor inválido em ${PLATFORM_ENVIRONMENT_VAR} — usando development.`,
    });
  }

  for (const mismatch of compatibility.criticalMismatches) {
    issues.push({
      severity: "error",
      code: mismatch.code,
      message: mismatch.message,
    });
  }

  for (const mismatch of compatibility.warningMismatches) {
    issues.push({
      severity: "warning",
      code: mismatch.code,
      message: mismatch.message,
    });
  }

  if (config.name === "production" && !resolution.productionExplicitlyDeclared) {
    issues.push({
      severity: "error",
      code: "production_not_explicitly_declared",
      message: "Production requer NEXT_PUBLIC_DOS_ENVIRONMENT=production explícito.",
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

export interface EnvironmentSourceSnapshot {
  source: EnvironmentSource;
  label: string;
  rawValue: string | null;
  mappedHint: string | null;
  role: DetectedEnvironmentSource["role"];
}

/** Snapshot seguro para widgets — sem URL, keys, UID ou e-mail. */
export interface EnvironmentStatusSnapshot {
  environment: PlatformEnvironment;
  canonicalEnvironment: PlatformEnvironment;
  effectiveEnvironment: PlatformEnvironment;
  environmentLabel: string;
  releaseChannel: string;
  declaredExplicitly: boolean;
  productionExplicitlyDeclared: boolean;
  detectedSources: EnvironmentSourceSnapshot[];
  hasDivergence: boolean;
  hasCriticalMismatch: boolean;
  mocksAllowed: boolean;
  mockRoleChangeAllowed: boolean;
  supabaseConfigured: boolean;
  validationValid: boolean;
  incompatibleConfiguration: boolean;
  alerts: string[];
  readinessHint: string;
}

function formatSourceSnapshot(source: DetectedEnvironmentSource): EnvironmentSourceSnapshot {
  return {
    source: source.source,
    label: ENVIRONMENT_SOURCE_LABELS[source.source],
    rawValue: source.rawValue,
    mappedHint: source.mappedHint,
    role: source.role,
  };
}

export function buildEnvironmentStatusSnapshot(input: {
  config: EnvironmentConfig;
  validation: EnvironmentValidationResult;
  supabaseConfigured: boolean;
  env?: NodeJS.ProcessEnv;
}): EnvironmentStatusSnapshot {
  const { config, validation, supabaseConfigured } = input;
  const profile = config.profile;
  const resolution = resolveCanonicalEnvironment({ env: input.env });
  const alerts = [
    ...validation.issues.map((issue) => issue.message),
    ...resolution.warnings,
  ];

  let readinessHint = "Ambiente local — mocks e fallback permitidos.";
  if (config.name === "staging") {
    readinessHint = "Staging — login real e profile operacional esperados.";
  }
  if (config.name === "production") {
    readinessHint = "Production — revisão de release e auth real obrigatórios.";
  }
  if (resolution.hasCriticalMismatch) {
    readinessHint =
      "Divergência crítica entre fontes — alinhe DOS e deploy antes de promover.";
  }

  return {
    environment: config.name,
    canonicalEnvironment: resolution.canonical,
    effectiveEnvironment: resolution.effectiveEnvironment,
    environmentLabel: PLATFORM_ENVIRONMENT_LABELS[config.name],
    releaseChannel: profile.releaseChannel,
    declaredExplicitly: config.declaredExplicitly,
    productionExplicitlyDeclared: resolution.productionExplicitlyDeclared,
    detectedSources: resolution.sources.map(formatSourceSnapshot),
    hasDivergence: resolution.mismatches.length > 0,
    hasCriticalMismatch: resolution.hasCriticalMismatch,
    mocksAllowed: profile.allowMocks,
    mockRoleChangeAllowed: profile.allowMockRoleChange,
    supabaseConfigured,
    validationValid: validation.valid,
    incompatibleConfiguration: !validation.safety.compatible || resolution.hasCriticalMismatch,
    alerts: [...new Set(alerts)],
    readinessHint,
  };
}

/** Input compacto para Production Safety Gate. */
export interface EnvironmentGateSnapshot {
  name: PlatformEnvironment;
  canonicalEnvironment: PlatformEnvironment;
  declaredExplicitly: boolean;
  productionExplicitlyDeclared: boolean;
  hasCriticalMismatch: boolean;
  mismatchCount: number;
  vercelEnvHint: string | null;
  allowMocks: boolean;
  allowMockRoleChange: boolean;
  requireAuthProfile: boolean;
  requireEdgeFunctionAudit: boolean;
  incompatible: boolean;
  validationValid: boolean;
}

export function toEnvironmentGateSnapshot(
  validation: EnvironmentValidationResult,
  options: { env?: NodeJS.ProcessEnv } = {},
): EnvironmentGateSnapshot {
  const profile = ENVIRONMENT_PROFILES[validation.environment];
  const resolution = resolveCanonicalEnvironment(options);
  const vercelSource = resolution.sources.find((s) => s.source === "vercel_env");

  return {
    name: validation.environment,
    canonicalEnvironment: resolution.canonical,
    declaredExplicitly: validation.declaredExplicitly,
    productionExplicitlyDeclared: resolution.productionExplicitlyDeclared,
    hasCriticalMismatch: resolution.hasCriticalMismatch,
    mismatchCount: resolution.mismatches.length,
    vercelEnvHint: vercelSource?.rawValue ?? null,
    allowMocks: profile.allowMocks,
    allowMockRoleChange: profile.allowMockRoleChange,
    requireAuthProfile: profile.requireAuthProfile,
    requireEdgeFunctionAudit: profile.requireEdgeFunctionAudit,
    incompatible:
      !validation.safety.compatible || resolution.hasCriticalMismatch || !validation.valid,
    validationValid: validation.valid,
  };
}
