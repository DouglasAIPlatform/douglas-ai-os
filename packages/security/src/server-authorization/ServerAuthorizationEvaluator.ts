import type { OperatorRole } from "../SecurityTypes";
import type { OperatorAuthorizationSnapshot } from "./OperatorAuthorizationSnapshot";
import {
  allowServerAuthorization,
  denyServerAuthorization,
  type ServerAuthorizationDecision,
} from "./ServerAuthorizationDecision";
import type { ServerAuthorizationContext } from "./ServerAuthorizationContext";
import type { ServerPermission } from "./ServerPermission";
import {
  canIngestAuditRemotely,
  getServerRolePermissions,
  serverRoleHasPermission,
} from "./ServerPermissionCatalog";

export interface EvaluateServerAuthorizationInput {
  userId: string | null;
  profileId: string | null;
  role: OperatorRole | null;
  status: "active" | "invited" | "suspended" | null;
  resolvedFromProfile: boolean;
  permission: ServerPermission;
}

export function buildOperatorAuthorizationSnapshot(input: {
  userId: string | null;
  profileId: string | null;
  role: OperatorRole | null;
  status: "active" | "invited" | "suspended" | null;
  resolvedFromProfile: boolean;
}): OperatorAuthorizationSnapshot {
  const active = input.status === "active" && input.role !== null;
  const permissions = input.role ? getServerRolePermissions(input.role) : [];

  return {
    userId: input.userId,
    profileId: input.profileId,
    role: input.role,
    status: input.status,
    active,
    permissions,
    canIngestAuditRemotely: input.role ? canIngestAuditRemotely(input.role) : false,
    resolvedFromProfile: input.resolvedFromProfile,
  };
}

export function evaluateServerPermission(
  input: EvaluateServerAuthorizationInput,
): ServerAuthorizationDecision {
  if (!input.userId) {
    return denyServerAuthorization("missing_auth", "auth.uid() ausente — sessão requerida.");
  }

  if (!input.resolvedFromProfile || !input.profileId) {
    return denyServerAuthorization(
      "profile_not_found",
      "operator_profiles ativo não encontrado para auth.uid().",
    );
  }

  if (input.status !== "active") {
    return denyServerAuthorization(
      "profile_inactive",
      "Profile inativo — autorização negada.",
    );
  }

  if (!input.role) {
    return denyServerAuthorization("role_not_allowed", "Role operacional ausente.");
  }

  if (!serverRoleHasPermission(input.role, input.permission)) {
    return denyServerAuthorization(
      "permission_denied",
      `Role ${input.role} não possui ${input.permission}.`,
      input.permission,
    );
  }

  return allowServerAuthorization(
    "authorized",
    `Autorizado — ${input.role} possui ${input.permission}.`,
    input.permission,
  );
}

export function evaluateAuditIngestServerAuthorization(input: {
  userId: string | null;
  profileId: string | null;
  role: OperatorRole | null;
  status: "active" | "invited" | "suspended" | null;
  resolvedFromProfile: boolean;
  payloadRole?: string | null;
}): ServerAuthorizationDecision {
  if (input.payloadRole && input.role && input.payloadRole !== input.role) {
    // Payload role is never trusted — server profile wins; note for observability only.
  }

  if (!input.userId) {
    return denyServerAuthorization("missing_auth", "Autenticação obrigatória para ingest.");
  }

  if (!input.resolvedFromProfile || !input.profileId) {
    return denyServerAuthorization("profile_not_found", "Perfil operacional não encontrado.");
  }

  if (input.status !== "active") {
    return denyServerAuthorization("profile_inactive", "Perfil inativo — ingest bloqueado.");
  }

  if (!input.role) {
    return denyServerAuthorization("role_not_allowed", "Role ausente no profile.");
  }

  if (!canIngestAuditRemotely(input.role)) {
    return denyServerAuthorization(
      "role_not_allowed",
      "Viewer não possui permissão operacional para ingest remoto.",
    );
  }

  return allowServerAuthorization(
    "authorized",
    `Ingest autorizado para role ${input.role} (server profile).`,
  );
}

export function toServerAuthorizationContext(
  snapshot: OperatorAuthorizationSnapshot,
  permission?: ServerPermission,
): ServerAuthorizationContext {
  return {
    userId: snapshot.userId,
    profileId: snapshot.profileId,
    role: snapshot.role,
    status: snapshot.status,
    resolvedFromProfile: snapshot.resolvedFromProfile,
    permission,
  };
}
