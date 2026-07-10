import type { PlatformOperatorRole, AuthorizedOperator } from "./AuthorizedOperator.ts";
import type { AuditAuthorizationFailure } from "./AuditAuthorizationResult.ts";
import { authorizationFailure } from "./AuditAuthorizationResult.ts";

/**
 * Roles permitidas para ingest remoto.
 *
 * viewer: bloqueado nesta sprint — não há forma segura de distinguir
 * ações próprias não-administrativas sem acoplar regras de negócio frágeis
 * ao payload do browser.
 */
const INGEST_ALLOWED_ROLES = new Set<PlatformOperatorRole>([
  "owner",
  "admin",
  "operator",
]);

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

  if (!INGEST_ALLOWED_ROLES.has(operator.role)) {
    return authorizationFailure(
      "role_not_allowed",
      "Role não autorizada para ingest remoto de audit",
      403,
    );
  }

  return null;
}
