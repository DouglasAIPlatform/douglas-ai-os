import { Environment } from "@douglas/core";
import { resolveEnvironmentConfig, resolvePlatformEnvironment } from "./EnvironmentConfigResolver";
import type { PlatformEnvironment } from "./PlatformEnvironment";

export type { PlatformEnvironment } from "./PlatformEnvironment";
export {
  PLATFORM_ENVIRONMENTS,
  PLATFORM_ENVIRONMENT_LABELS,
  PLATFORM_ENVIRONMENT_VAR,
  isPlatformEnvironment,
} from "./PlatformEnvironment";

export type { ReleaseChannel } from "./ReleaseChannel";
export {
  RELEASE_CHANNELS,
  RELEASE_CHANNEL_LABELS,
  isReleaseChannel,
  toReleaseChannel,
} from "./ReleaseChannel";

export type { EnvironmentSource, EnvironmentSourceRole } from "./EnvironmentSource";
export {
  ENVIRONMENT_SOURCE_LABELS,
  SERVER_ENVIRONMENT_VAR,
} from "./EnvironmentSource";

export type { EnvironmentMismatch, EnvironmentMismatchSeverity } from "./EnvironmentMismatch";
export { isCriticalMismatch } from "./EnvironmentMismatch";

export type {
  DetectedEnvironmentSource,
  EnvironmentResolution,
} from "./EnvironmentResolution";

export type { EnvironmentCompatibilityReport } from "./EnvironmentCompatibilityReport";
export { buildEnvironmentCompatibilityReport } from "./EnvironmentCompatibilityReport";

export {
  CanonicalEnvironmentResolver,
  resolveCanonicalEnvironment,
  type CanonicalEnvironmentResolverOptions,
} from "./CanonicalEnvironmentResolver";

export {
  coreEnvironmentToPlatform,
  platformToCoreEnvironment,
  isCoreEnvironmentName,
} from "./adapters/CoreEnvironmentAdapter";

export {
  readVercelEnv,
  vercelEnvToPlatformHint,
  isVercelPreview,
  isVercelProduction,
  type VercelEnvValue,
} from "./adapters/VercelEnvAdapter";

export {
  platformToLegacySupabaseEnvironment,
  legacySupabaseEnvironmentToPlatformHint,
  legacySupabaseEnvironmentLabel,
  type LegacySupabaseEnvironment,
} from "./adapters/SupabaseEnvironmentAdapter";

export type { EnvironmentProfile } from "./EnvironmentProfile";
export {
  ENVIRONMENT_PROFILES,
  getEnvironmentProfile,
} from "./EnvironmentProfile";

export type { EnvironmentConfig } from "./EnvironmentConfig";
export { buildEnvironmentConfig } from "./EnvironmentConfig";

export {
  resolveDemoDataModeFromEnvironment,
  resolveEnvironmentConfig,
  resolvePlatformEnvironment,
  resolvePlatformEnvironmentProfile,
  toDemoDataMode,
  isMocksAllowed,
  isMockRoleChangeAllowedByEnvironment,
  type ResolveEnvironmentConfigOptions,
} from "./EnvironmentConfigResolver";

export type {
  EnvironmentSafetyContext,
  EnvironmentSafetyEvaluation,
} from "./EnvironmentSafetyPolicy";
export {
  EnvironmentSafetyPolicy,
  createEnvironmentSafetyPolicy,
  evaluateEnvironmentSafety,
  isNonDevelopmentEnvironment,
  isProductionEnvironment,
} from "./EnvironmentSafetyPolicy";

export type {
  EnvironmentValidationIssue,
  EnvironmentValidationResult,
  EnvironmentValidationSeverity,
  EnvironmentStatusSnapshot,
  EnvironmentGateSnapshot,
  EnvironmentSourceSnapshot,
} from "./EnvironmentValidationResult";
export {
  buildEnvironmentStatusSnapshot,
  toEnvironmentGateSnapshot,
  validateEnvironmentConfig,
} from "./EnvironmentValidationResult";

export { Environment, type EnvironmentConfig as CoreEnvironmentConfig } from "@douglas/core";

/** Facade alinhada ao resolver canônico — evita defaults divergentes do core. */
export class PlatformEnvironmentFacade {
  private readonly core: Environment;

  constructor(name?: PlatformEnvironment) {
    this.core = new Environment(name ?? resolvePlatformEnvironment());
  }

  getName() {
    return this.core.getName();
  }

  getConfig() {
    return resolveEnvironmentConfig();
  }
}

/** Cria @douglas/core Environment delegando ao resolver canônico. */
export function createCoreEnvironmentFromCanonical(
  options?: import("./EnvironmentConfigResolver").ResolveEnvironmentConfigOptions,
): Environment {
  return new Environment(resolvePlatformEnvironment(options));
}
