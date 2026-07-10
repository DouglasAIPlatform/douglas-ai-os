/** Razões estáveis para decisões server-side — alinhadas a audit-ingest error codes quando aplicável. */
export type ServerAuthorizationReason =
  | "authorized"
  | "missing_auth"
  | "profile_not_found"
  | "profile_inactive"
  | "permission_denied"
  | "role_not_allowed"
  | "payload_role_untrusted"
  | "catalog_mismatch";

export const SERVER_AUTHORIZATION_REASON_LABELS: Record<ServerAuthorizationReason, string> = {
  authorized: "Autorizado",
  missing_auth: "Autenticação ausente",
  profile_not_found: "Profile não encontrado",
  profile_inactive: "Profile inativo",
  permission_denied: "Permissão negada",
  role_not_allowed: "Role não permitida",
  payload_role_untrusted: "Role do payload ignorada",
  catalog_mismatch: "Catálogo divergente",
};
