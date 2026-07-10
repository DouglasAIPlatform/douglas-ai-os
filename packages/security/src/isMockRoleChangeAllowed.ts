import { isMockRoleChangeAllowedByEnvironment } from "@douglas/environment";

/**
 * Whether OperatorProvider allows free mock role switching.
 * Deriva de NEXT_PUBLIC_DOS_ENVIRONMENT quando disponível (Sprint 5.39).
 * Fallback legado: NODE_ENV !== "production".
 */
export function resolveMockRoleChangeAllowed(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  const fromPlatform = isMockRoleChangeAllowedByEnvironment();
  if (process.env.NEXT_PUBLIC_DOS_ENVIRONMENT?.trim()) {
    return fromPlatform;
  }
  return nodeEnv !== "production";
}

export function isMockRoleChangeAllowed(): boolean {
  return resolveMockRoleChangeAllowed();
}
