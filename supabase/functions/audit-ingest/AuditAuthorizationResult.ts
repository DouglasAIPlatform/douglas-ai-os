import type { AuditActorResolution } from "./AuditActorResolution.ts";
import type { AuditIngestAuthMode } from "./AuditAuthMode.ts";
import type { AuthorizedOperator } from "./AuthorizedOperator.ts";

/** Códigos de erro de auth/autorização (Sprint 5.35). */
export type AuditAuthErrorCode =
  | "missing_auth"
  | "invalid_token"
  | "profile_not_found"
  | "profile_inactive"
  | "role_not_allowed"
  | "actor_resolution_failed"
  | "internal_error";

export type AuditAuthorizationSuccess =
  | {
      kind: "authenticated";
      operator: AuthorizedOperator;
      actor: AuditActorResolution;
      authMode: AuditIngestAuthMode;
    }
  | {
      kind: "bypass";
      actor: AuditActorResolution;
      authMode: AuditIngestAuthMode;
    };

export interface AuditAuthorizationFailure {
  kind: "failure";
  errorCode: AuditAuthErrorCode;
  message: string;
  httpStatus: number;
}

export type AuditAuthorizationResult = AuditAuthorizationSuccess | AuditAuthorizationFailure;

export function authorizationFailure(
  errorCode: AuditAuthErrorCode,
  message: string,
  httpStatus: number,
): AuditAuthorizationFailure {
  return { kind: "failure", errorCode, message, httpStatus };
}
