import type { ServerAuthorizationReason } from "./ServerAuthorizationReason";

export type ServerAuthorizationOutcome = "allow" | "deny";

export interface ServerAuthorizationDecision {
  outcome: ServerAuthorizationOutcome;
  reason: ServerAuthorizationReason;
  message: string;
  /** Permissão avaliada, quando aplicável. */
  permission?: string;
}

export function allowServerAuthorization(
  reason: ServerAuthorizationReason,
  message: string,
  permission?: string,
): ServerAuthorizationDecision {
  return { outcome: "allow", reason, message, permission };
}

export function denyServerAuthorization(
  reason: ServerAuthorizationReason,
  message: string,
  permission?: string,
): ServerAuthorizationDecision {
  return { outcome: "deny", reason, message, permission };
}
