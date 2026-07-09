import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "../../SupabaseConfig";
import { probeSupabaseTableReadOnly } from "../../staging-validation/probeSupabaseTableReadOnly";
import { SUPABASE_TABLES } from "../../schema";
import type { AuthProfile, AuthSessionState } from "../AuthTypes";
import {
  buildOperatorProfileBootstrapRecommendation,
  type OperatorProfileBootstrapRecommendation,
} from "./OperatorProfileBootstrapRecommendation";
import type { OperatorProfileBootstrapStatus } from "./OperatorProfileBootstrapStatus";

export interface OperatorProfileBootstrapReport {
  status: OperatorProfileBootstrapStatus;
  recommendation: OperatorProfileBootstrapRecommendation;
  hasOperatorProfile: boolean;
  tableDetected: boolean | null;
  /** Sprint 5.29 — browser never performs INSERT */
  canBootstrapFromClient: false;
  usingMockFallback: boolean;
  checkedAt: string;
}

export interface OperatorProfileBootstrapRequestResult extends OperatorProfileBootstrapReport {
  /** Always false in Sprint 5.29 — reserved for future admin/Edge flow */
  clientBootstrapAttempted: false;
  requestMessage: string;
}

export interface ResolveOperatorProfileBootstrapInput {
  config: SupabaseConfig;
  client: SupabaseClient | null;
  session: Pick<
    AuthSessionState,
    "status" | "provider" | "user" | "profile" | "mode"
  >;
  usingMockFallback?: boolean;
}

export interface RequestOperatorProfileBootstrapInput
  extends ResolveOperatorProfileBootstrapInput {
  /** Optional reload after admin INSERT — e.g. authSession.refreshSession + adapter.loadProfile */
  reloadProfile?: () => Promise<AuthProfile | null>;
}

export async function resolveOperatorProfileBootstrapStatus(
  input: ResolveOperatorProfileBootstrapInput,
  tableDetected: boolean | null,
): Promise<OperatorProfileBootstrapStatus> {
  const { config, session } = input;

  if (!config.isConfigured || session.provider === "none") {
    return "not_configured";
  }

  if (session.status === "loading" || session.status === "unauthenticated") {
    return "not_authenticated";
  }

  if (session.status !== "authenticated" || !session.user) {
    return "not_authenticated";
  }

  if (session.profile) {
    return "profile_found";
  }

  if (tableDetected === false) {
    return "bootstrap_required";
  }

  if (tableDetected === true) {
    return "bootstrap_blocked_by_rls";
  }

  return "profile_missing";
}

/**
 * Resolves operator profile bootstrap state (read-only — no INSERT).
 */
export async function resolveOperatorProfileBootstrap(
  input: ResolveOperatorProfileBootstrapInput,
): Promise<OperatorProfileBootstrapReport> {
  const { config, client, session, usingMockFallback = false } = input;

  let tableDetected: boolean | null = null;
  if (config.isConfigured && client) {
    const probe = await probeSupabaseTableReadOnly(
      client,
      SUPABASE_TABLES.operatorProfiles,
    );
    tableDetected = probe.detected;
  }

  const status = await resolveOperatorProfileBootstrapStatus(input, tableDetected);
  const recommendation = buildOperatorProfileBootstrapRecommendation(status, {
    userId: session.user?.id,
    tableDetected: tableDetected ?? undefined,
  });

  return {
    status,
    recommendation,
    hasOperatorProfile: session.profile !== null,
    tableDetected,
    canBootstrapFromClient: false,
    usingMockFallback:
      usingMockFallback ||
      (session.status === "authenticated" && !session.profile),
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Future entry point for bootstrap flows.
 * Sprint 5.29: never writes from browser — returns manual recommendation only.
 */
export async function requestOperatorProfileBootstrap(
  input: RequestOperatorProfileBootstrapInput,
): Promise<OperatorProfileBootstrapRequestResult> {
  let session = input.session;

  if (input.reloadProfile) {
    const profile = await input.reloadProfile();
    if (profile) {
      session = { ...session, profile };
    }
  }

  const report = await resolveOperatorProfileBootstrap({
    ...input,
    session,
  });

  const requestMessage =
    report.status === "profile_found"
      ? "Profile encontrado após verificação — bootstrap não necessário."
      : report.status === "bootstrap_blocked_by_rls"
        ? "Bootstrap via browser indisponível (RLS). Siga orientação administrativa segura."
        : "Bootstrap automático desativado nesta sprint — siga os passos manuais recomendados.";

  return {
    ...report,
    clientBootstrapAttempted: false,
    requestMessage,
  };
}
