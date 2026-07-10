/** Modo de autenticação/autorização da Edge Function audit-ingest (Sprint 5.35). */
export type AuditIngestAuthMode = "disabled" | "optional" | "required";

/**
 * Resolve modo de auth.
 *
 * Prioridade:
 * 1. AUDIT_INGEST_AUTH_MODE explícito
 * 2. AUDIT_INGEST_REQUIRE_JWT=true → required (compat 5.33)
 * 3. default optional — dev local sem JWT continua funcionando
 */
export function resolveAuditIngestAuthMode(): AuditIngestAuthMode {
  const explicit = Deno.env.get("AUDIT_INGEST_AUTH_MODE")?.trim().toLowerCase();

  if (explicit === "disabled" || explicit === "optional" || explicit === "required") {
    return explicit;
  }

  if (Deno.env.get("AUDIT_INGEST_REQUIRE_JWT") === "true") {
    return "required";
  }

  return "optional";
}

export function isAuthEnforced(mode: AuditIngestAuthMode): boolean {
  return mode === "required";
}

export function isAuthBypassAllowed(mode: AuditIngestAuthMode, hasBearer: boolean): boolean {
  if (mode === "disabled") {
    return true;
  }
  if (mode === "optional" && !hasBearer) {
    return true;
  }
  return false;
}
