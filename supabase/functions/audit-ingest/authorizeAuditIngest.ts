import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  isAuthBypassAllowed,
  isAuthEnforced,
  resolveAuditIngestAuthMode,
  type AuditIngestAuthMode,
} from "./AuditAuthMode.ts";
import { resolveAuditActorFromOperator, resolveAuditActorFromPayload } from "./AuditActorResolution.ts";
import { evaluateOperatorAuthorization } from "./AuditAuthorizationPolicy.ts";
import type { AuditAuthorizationResult } from "./AuditAuthorizationResult.ts";
import { authorizationFailure } from "./AuditAuthorizationResult.ts";
import { parseOperatorProfileRow } from "./AuthorizedOperator.ts";

const OPERATOR_PROFILES_TABLE = "operator_profiles";

function readBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

async function lookupOperatorProfile(
  adminClient: SupabaseClient,
  userId: string,
): Promise<ReturnType<typeof parseOperatorProfileRow>> {
  const { data, error } = await adminClient
    .from(OPERATOR_PROFILES_TABLE)
    .select("id, user_id, display_name, role, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("audit-ingest profile_lookup_failed", error.code ?? "unknown");
    return null;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  return parseOperatorProfileRow(data as Record<string, unknown>);
}

async function authenticateToken(
  supabaseUrl: string,
  token: string,
): Promise<{ userId: string } | AuditAuthorizationResult> {
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!anonKey) {
    return authorizationFailure(
      "internal_error",
      "Função indisponível — configuração incompleta",
      500,
    );
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user?.id) {
    return authorizationFailure(
      "invalid_token",
      "Token de autenticação inválido ou expirado",
      401,
    );
  }

  return { userId: data.user.id };
}

export interface AuthorizeAuditIngestInput {
  req: Request;
  supabaseUrl: string;
  adminClient: SupabaseClient;
  payload: {
    actor: string;
    role: string;
    metadata: Record<string, unknown>;
  };
}

/**
 * Autentica JWT, resolve operator_profiles, aplica política de roles
 * e deriva identidade do ator server-side.
 */
export async function authorizeAuditIngest(
  input: AuthorizeAuditIngestInput,
): Promise<AuditAuthorizationResult> {
  const authMode = resolveAuditIngestAuthMode();
  const token = readBearerToken(input.req);
  const hasBearer = token !== null;

  if (isAuthBypassAllowed(authMode, hasBearer)) {
    return {
      kind: "bypass",
      authMode,
      actor: resolveAuditActorFromPayload(input.payload),
    };
  }

  if (!token) {
    return authorizationFailure(
      "missing_auth",
      "Autenticação obrigatória para audit-ingest",
      401,
    );
  }

  const authResult = await authenticateToken(input.supabaseUrl, token);
  if ("kind" in authResult && authResult.kind === "failure") {
    return authResult;
  }

  const userId = (authResult as { userId: string }).userId;
  const operator = await lookupOperatorProfile(input.adminClient, userId);

  if (!operator) {
    return authorizationFailure(
      "profile_not_found",
      "Perfil operacional não encontrado para esta sessão",
      403,
    );
  }

  const policyFailure = evaluateOperatorAuthorization(operator);
  if (policyFailure) {
    return policyFailure;
  }

  const actor = resolveAuditActorFromOperator(operator);
  if (!actor.actorId || !actor.actorName || !actor.actorRole) {
    return authorizationFailure(
      "actor_resolution_failed",
      "Falha ao resolver identidade do ator",
      500,
    );
  }

  if (isAuthEnforced(authMode) || authMode === "optional") {
    return {
      kind: "authenticated",
      authMode,
      operator,
      actor,
    };
  }

  return authorizationFailure(
    "internal_error",
    "Função indisponível — modo de auth inválido",
    500,
  );
}
