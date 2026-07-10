import type { EnvironmentConfig } from "./EnvironmentConfig";
import { getEnvironmentProfile } from "./EnvironmentProfile";
import type { PlatformEnvironment } from "./PlatformEnvironment";

export interface EnvironmentSafetyContext {
  /** Supabase URL/key presentes — sem expor valores. */
  supabaseConfigured?: boolean;
  isUsingMockOperator?: boolean;
  mockRoleChangeAllowed?: boolean;
  hasAuthProfile?: boolean;
  userAuthenticated?: boolean;
  auditWriteMode?: string | null;
}

export interface EnvironmentSafetyEvaluation {
  compatible: boolean;
  blockingIssues: string[];
  warnings: string[];
}

/** Avalia compatibilidade runtime com políticas do ambiente. */
export function evaluateEnvironmentSafety(
  config: EnvironmentConfig,
  context: EnvironmentSafetyContext = {},
): EnvironmentSafetyEvaluation {
  const profile = getEnvironmentProfile(config.name);
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  if (config.rawEnvironmentValue && !config.declaredExplicitly) {
    warnings.push("Valor de ambiente inválido — usando development.");
  } else if (
    config.rawEnvironmentValue &&
    config.rawEnvironmentValue !== config.name
  ) {
    warnings.push(
      `Valor inválido "${config.rawEnvironmentValue}" — efetivo: ${config.name}.`,
    );
  }

  if (!profile.allowMocks && context.isUsingMockOperator) {
    blockingIssues.push("Mocks operacionais não permitidos neste ambiente.");
  }

  if (!profile.allowMockRoleChange && context.mockRoleChangeAllowed) {
    blockingIssues.push("Troca livre de mock role bloqueada neste ambiente.");
  }

  if (profile.requireRealAuth && context.userAuthenticated === false) {
    blockingIssues.push("Autenticação real obrigatória neste ambiente.");
  }

  if (profile.requireAuthProfile && context.hasAuthProfile === false) {
    blockingIssues.push("operator_profiles real obrigatório neste ambiente.");
  }

  if (
    profile.requireEdgeFunctionAudit &&
    context.auditWriteMode &&
    context.auditWriteMode !== "edge_function"
  ) {
    blockingIssues.push("Audit writeMode edge_function obrigatório neste ambiente.");
  }

  if (profile.name === "production" && !config.declaredExplicitly) {
    warnings.push(
      "Production efetivo sem NEXT_PUBLIC_DOS_ENVIRONMENT explícito — confirme deploy.",
    );
  }

  if (profile.name === "development" && context.supabaseConfigured === false) {
    // esperado — sem warning
  }

  return {
    compatible: blockingIssues.length === 0,
    blockingIssues,
    warnings,
  };
}

export function isProductionEnvironment(name: PlatformEnvironment): boolean {
  return name === "production";
}

export function isNonDevelopmentEnvironment(name: PlatformEnvironment): boolean {
  return name === "staging" || name === "production";
}

export class EnvironmentSafetyPolicy {
  evaluate(
    config: EnvironmentConfig,
    context: EnvironmentSafetyContext = {},
  ): EnvironmentSafetyEvaluation {
    return evaluateEnvironmentSafety(config, context);
  }

  getProfile(name: PlatformEnvironment) {
    return getEnvironmentProfile(name);
  }
}

export function createEnvironmentSafetyPolicy(): EnvironmentSafetyPolicy {
  return new EnvironmentSafetyPolicy();
}
