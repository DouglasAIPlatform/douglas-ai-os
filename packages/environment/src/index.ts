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
} from "./EnvironmentValidationResult";
export {
  buildEnvironmentStatusSnapshot,
  toEnvironmentGateSnapshot,
  validateEnvironmentConfig,
} from "./EnvironmentValidationResult";

export { Environment, type EnvironmentConfig as CoreEnvironmentConfig } from "@douglas/core";

/** Facade alinhada ao @douglas/core — evita duplicar defaults de API URL. */
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
