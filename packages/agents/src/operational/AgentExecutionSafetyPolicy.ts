import type { OperationalAgentCapability } from "./OperationalAgentTypes";

export const FORBIDDEN_OPERATIONAL_CAPABILITIES = [
  "deploy",
  "migration",
  "delete",
  "secret:access",
  "shell:execute",
  "role:escalate",
  "config:critical",
  "service_role:access",
  "network:unrestricted",
  "release:approve_production",
  "tag:create",
  "git:commit",
  "git:push",
] as const;

export type ForbiddenOperationalCapability = (typeof FORBIDDEN_OPERATIONAL_CAPABILITIES)[number];

export interface AgentExecutionSafetyInput {
  capabilities: OperationalAgentCapability[];
  requestedAction?: string;
}

export function validateAgentCapabilitiesSafe(
  capabilities: OperationalAgentCapability[],
): { safe: boolean; violations: string[] } {
  const violations = capabilities.filter((capability) =>
    FORBIDDEN_OPERATIONAL_CAPABILITIES.some(
      (forbidden) => capability === forbidden || capability.includes(forbidden),
    ),
  );

  return { safe: violations.length === 0, violations };
}

/** Agente operacional deve ser read-only nesta sprint. */
export function assertAgentExecutionSafe(input: AgentExecutionSafetyInput): void {
  const { safe, violations } = validateAgentCapabilitiesSafe(input.capabilities);
  if (!safe) {
    throw new Error(`Capabilities perigosas detectadas: ${violations.join(", ")}`);
  }

  const action = input.requestedAction?.toLowerCase() ?? "";
  const blockedPatterns = ["deploy", "migrate", "delete", "shell", "secret", "service_role"];
  if (blockedPatterns.some((pattern) => action.includes(pattern))) {
    throw new Error("Ação bloqueada pela política de segurança do agente");
  }
}

export function isReadOnlyOperationalAgent(capabilities: OperationalAgentCapability[]): boolean {
  const { safe } = validateAgentCapabilitiesSafe(capabilities);
  return safe;
}
