import type { PlatformOperatorRole, AuthorizedOperator } from "./AuthorizedOperator.ts";
import type { AuditAuthorizationFailure } from "./AuditAuthorizationResult.ts";
import { authorizationFailure } from "./AuditAuthorizationResult.ts";
import { canIngestAuditRemotely } from "./ServerPermissionCatalog.ts";

/**
 * Autorização server-side para ingest — deriva role do profile, não do payload.
 * Viewer bloqueado (somente platform:view — sem runtime:refresh).
 */
export function evaluateOperatorAuthorization(
  operator: AuthorizedOperator,
): AuditAuthorizationFailure | null {
  if (operator.status !== "active") {
    return authorizationFailure(
      "profile_inactive",
      "Perfil operacional inativo — ingest bloqueado",
      403,
    );
  }

  if (!canIngestAuditRemotely(operator.role as PlatformOperatorRole)) {
    return authorizationFailure(
      "role_not_allowed",
      "Role não autorizada para ingest remoto de audit (catálogo server-side)",
      403,
    );
  }

  return null;
}
