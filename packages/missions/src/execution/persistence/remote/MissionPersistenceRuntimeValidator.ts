import type { SupabaseClient } from "@supabase/supabase-js";
import type { MissionOperatorRole } from "../../MissionExecutionTypes";
import {
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
} from "../../MissionExecutionTypes";
import { canPerformMissionExecution } from "../../MissionExecutionAccessPolicy";
import type { MissionExecutionPersistenceHealth } from "../MissionExecutionPersistenceHealth";
import type { MissionExecutionPersistenceMode } from "../MissionExecutionPersistenceMode";
import { isSupabaseMissionPersistenceRequired } from "../MissionExecutionPersistenceMode";
import type { MissionExecutionPersistenceWriteMeta } from "../SupabaseMissionExecutionMapper";
import {
  createSupabaseMissionExecutionPersistence,
} from "../SupabaseMissionExecutionPersistence";
import { evaluateMissionPersistenceFallback } from "./MissionPersistenceFallbackPolicy";
import {
  buildInitialRemoteChecks,
  type MissionPersistenceRemoteCheck,
  type MissionPersistenceRemoteCheckId,
} from "./MissionPersistenceRemoteCheck";
import {
  buildMissionPersistenceRemoteReport,
  type MissionPersistenceRemoteEvidence,
  type MissionPersistenceRemoteReport,
} from "./MissionPersistenceRemoteReport";
import {
  buildAcceptanceExecutionId,
  buildAcceptanceMissionContext,
} from "./MissionPersistenceTestDataPolicy";

export interface MissionPersistenceRuntimeValidatorInput {
  environment: string;
  configuredMode: MissionExecutionPersistenceMode;
  health: MissionExecutionPersistenceHealth;
  supabaseClient: SupabaseClient | null;
  writeMeta?: MissionExecutionPersistenceWriteMeta;
  role: MissionOperatorRole;
  profileActive: boolean;
  isAuthenticated: boolean;
}

export interface MissionPersistenceRuntimeValidatorEligibility {
  allowed: boolean;
  reason: string;
}

function patchCheck(
  checks: MissionPersistenceRemoteCheck[],
  id: MissionPersistenceRemoteCheckId,
  status: MissionPersistenceRemoteCheck["status"],
  message: string,
): void {
  const item = checks.find((entry) => entry.id === id);
  if (item) {
    item.status = status;
    item.message = message;
  }
}

/** Validator seguro — browser autenticado, client público, sem service_role. */
export class MissionPersistenceRuntimeValidator {
  /** Nunca executa automaticamente — Sprint 5.54. */
  static readonly autoRun = false;

  static evaluateEligibility(
    input: MissionPersistenceRuntimeValidatorInput,
  ): MissionPersistenceRuntimeValidatorEligibility {
    if (input.environment !== "staging") {
      return {
        allowed: false,
        reason: "Validação remota disponível apenas em staging.",
      };
    }

    if (!input.isAuthenticated) {
      return { allowed: false, reason: "Login real necessário." };
    }

    if (!input.profileActive) {
      return { allowed: false, reason: "operator_profile ativo necessário." };
    }

    if (input.role === "viewer") {
      return { allowed: false, reason: "Viewer não pode executar validação de escrita." };
    }

    if (!input.supabaseClient) {
      return { allowed: false, reason: "Cliente Supabase indisponível." };
    }

    if (!input.writeMeta?.createdByUserId) {
      return { allowed: false, reason: "Sessão sem identidade de escrita." };
    }

    if (!isSupabaseMissionPersistenceRequired(input.configuredMode)) {
      return {
        allowed: false,
        reason: "Staging exige modo supabase_required.",
      };
    }

    const canExecuteDiagnostic = canPerformMissionExecution({
      role: input.role,
      missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
      capability: "execute",
    });

    if (!canExecuteDiagnostic) {
      return { allowed: false, reason: "Role sem permissão para missões operacionais." };
    }

    return { allowed: true, reason: "Elegível para validação segura." };
  }

  static buildUnknownReport(environment: string): MissionPersistenceRemoteReport {
    const startedAt = new Date().toISOString();
    return buildMissionPersistenceRemoteReport({
      environment,
      configuredMode: "unknown",
      effectiveAdapter: "unknown",
      checks: buildInitialRemoteChecks(),
      startedAt,
      summary: "Validação remota ainda não executada.",
    });
  }

  async runSafeAcceptance(
    input: MissionPersistenceRuntimeValidatorInput,
  ): Promise<MissionPersistenceRemoteReport> {
    const startedAt = new Date().toISOString();
    const checks = buildInitialRemoteChecks();
    const evidence: MissionPersistenceRemoteEvidence[] = [];

    const eligibility = MissionPersistenceRuntimeValidator.evaluateEligibility(input);
    if (!eligibility.allowed) {
      for (const check of checks) {
        check.status = "blocked";
        check.message = eligibility.reason;
      }
      return buildMissionPersistenceRemoteReport({
        environment: input.environment,
        configuredMode: input.configuredMode,
        effectiveAdapter: input.health.activeAdapter,
        checks,
        evidence,
        startedAt,
        completedAt: new Date().toISOString(),
        summary: eligibility.reason,
      });
    }

    const client = input.supabaseClient!;
    const meta = input.writeMeta!;
    const remote = createSupabaseMissionExecutionPersistence(client);
    const stamp = Date.now();

    patchCheck(
      checks,
      "supabase_configured",
      input.health.supabaseConfigured ? "passed" : "failed",
      input.health.supabaseConfigured
        ? "Cliente Supabase configurado."
        : "Supabase não configurado.",
    );

    const health = await remote.checkHealth();
    patchCheck(
      checks,
      "tables_accessible",
      health.supabaseTableReady ? "passed" : "failed",
      health.supabaseTableReady
        ? "Tabelas mission_executions acessíveis."
        : health.lastError ?? "Tabelas indisponíveis — migration pendente?",
    );

    patchCheck(
      checks,
      "rls_active",
      health.supabaseTableReady ? "passed" : "pending",
      "RLS inferido via acesso autenticado (sem service_role).",
    );

    const fallbackEval = evaluateMissionPersistenceFallback({
      environment: input.environment,
      configuredMode: input.configuredMode,
      effectiveMode: input.health.mode,
      fallbackActive: input.health.fallbackActive,
      pendingSyncCount: input.health.pendingSyncCount,
    });

    patchCheck(
      checks,
      "fallback_inactive",
      fallbackEval.fallbackActive ? "failed" : "passed",
      fallbackEval.fallbackActive
        ? "Fallback sessionStorage ativo — blocker em staging."
        : "Fallback inativo.",
    );

    patchCheck(
      checks,
      "pending_queue_empty",
      input.health.pendingSyncCount === 0 ? "passed" : "failed",
      input.health.pendingSyncCount === 0
        ? "Pending queue vazia."
        : `${input.health.pendingSyncCount} item(ns) pendente(s).`,
    );

    if (input.role === "viewer") {
      patchCheck(checks, "create_blocked_viewer", "passed", "Viewer bloqueado para escrita.");
      patchCheck(checks, "create_execution_authorized", "failed", "Viewer não autorizado.");
    } else {
      patchCheck(
        checks,
        "create_blocked_viewer",
        "pending",
        "Requer sessão viewer — não testado nesta execução.",
      );
    }

    if (!health.supabaseTableReady) {
      return buildMissionPersistenceRemoteReport({
        environment: input.environment,
        configuredMode: input.configuredMode,
        effectiveAdapter: input.health.activeAdapter,
        checks,
        evidence,
        startedAt,
        completedAt: new Date().toISOString(),
        summary: "Migration/tabelas indisponíveis — validação remota bloqueada.",
      });
    }

    const diagnosticContext = buildAcceptanceMissionContext({
      missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
      createdBy: meta.createdByUserId.slice(0, 8),
      createdByUserId: meta.createdByUserId,
      createdByRole: input.role,
      stamp,
    });

    const diagnosticSave = await remote.saveExecution(diagnosticContext, meta);
    patchCheck(
      checks,
      "create_execution_authorized",
      diagnosticSave.success ? "passed" : "failed",
      diagnosticSave.success
        ? "Execução acceptance gravada."
        : diagnosticSave.error ?? "Falha ao gravar execução.",
    );
    patchCheck(
      checks,
      "operational_diagnostic_persisted",
      diagnosticSave.success ? "passed" : "failed",
      diagnosticSave.success
        ? "operational_diagnostic persistido."
        : diagnosticSave.error ?? "Falha.",
    );

    if (diagnosticSave.success) {
      evidence.push({
        id: "diagnostic_execution",
        label: "Acceptance diagnostic",
        summary: `Execução gravada (${diagnosticContext.executionId.slice(0, 24)}…).`,
      });

      const event1 = await remote.appendContextEvent(
        diagnosticContext,
        1,
        "acceptance:started",
        "Acceptance timeline event 1",
      );
      const event2 = await remote.appendContextEvent(
        { ...diagnosticContext, status: "running", progress: 50 },
        2,
        "acceptance:progress",
        "Acceptance timeline event 2",
      );

      patchCheck(
        checks,
        "timeline_persisted",
        event1.success && event2.success ? "passed" : "failed",
        event1.success && event2.success
          ? "Timeline com eventos ordenados."
          : event2.error ?? event1.error ?? "Falha na timeline.",
      );

      const completedContext = {
        ...diagnosticContext,
        status: "completed" as const,
        progress: 100,
        resultSummary: "Acceptance completed",
      };
      const completion = await remote.updateExecution(completedContext, meta);
      patchCheck(
        checks,
        "completion_persisted",
        completion.success ? "passed" : "failed",
        completion.success ? "Status completed persistido." : completion.error ?? "Falha.",
      );

      const reloaded = await remote.getExecution(diagnosticContext.executionId);
      patchCheck(
        checks,
        "read_after_reload",
        reloaded?.status === "completed" ? "passed" : "failed",
        reloaded
          ? `Reload OK — status ${reloaded.status}.`
          : "Execução não encontrada após gravação.",
      );

      const dupSave = await remote.saveExecution(diagnosticContext, meta);
      patchCheck(
        checks,
        "duplicate_execution_rejected",
        !dupSave.success && dupSave.errorCode === "duplicate_execution"
          ? "passed"
          : dupSave.success
            ? "failed"
            : "warning",
        dupSave.errorCode === "duplicate_execution"
          ? "Duplicata de executionId rejeitada."
          : dupSave.success
            ? "Duplicata aceita — inesperado."
            : dupSave.error ?? "Resposta inesperada.",
      );

      const dupEvent = await remote.appendContextEvent(
        diagnosticContext,
        2,
        "acceptance:duplicate",
        "Duplicate sequence probe",
      );
      patchCheck(
        checks,
        "duplicate_event_rejected",
        !dupEvent.success && dupEvent.errorCode === "duplicate_event"
          ? "passed"
          : "warning",
        dupEvent.errorCode === "duplicate_event"
          ? "Evento duplicado rejeitado."
          : dupEvent.error ?? "Resposta inesperada.",
      );
    }

    const releaseStamp = stamp + 1;
    const releaseContext = buildAcceptanceMissionContext({
      missionType: RELEASE_READINESS_REVIEW_MISSION_TYPE,
      createdBy: meta.createdByUserId.slice(0, 8),
      createdByUserId: meta.createdByUserId,
      createdByRole: input.role,
      stamp: releaseStamp,
    });
    const releaseSave = await remote.saveExecution(releaseContext, meta);
    patchCheck(
      checks,
      "release_readiness_review_persisted",
      releaseSave.success ? "passed" : "failed",
      releaseSave.success
        ? "release_readiness_review persistido."
        : releaseSave.error ?? "Falha.",
    );

    const invalidContext = buildAcceptanceMissionContext({
      missionType: "invalid_mission_type_probe",
      createdBy: meta.createdByUserId.slice(0, 8),
      createdByUserId: meta.createdByUserId,
      createdByRole: input.role,
      stamp: stamp + 2,
    });
    invalidContext.executionId = buildAcceptanceExecutionId("invalid_probe", stamp + 2);
    const invalidSave = await remote.saveExecution(invalidContext, meta);
    patchCheck(
      checks,
      "unknown_mission_type_rejected",
      !invalidSave.success ? "passed" : "failed",
      !invalidSave.success
        ? "Mission type desconhecido rejeitado."
        : "Tipo inválido aceito — RLS/policy falhou.",
    );

    const remoteConfirmed =
      diagnosticSave.success
      && releaseSave.success
      && !fallbackEval.fallbackActive
      && input.health.pendingSyncCount === 0;

    if (remoteConfirmed) {
      evidence.push({
        id: "remote_confirmed",
        label: "Persistência remota",
        summary: "Dois tipos persistidos; fallback inativo; queue vazia.",
      });
    }

    return buildMissionPersistenceRemoteReport({
      environment: input.environment,
      configuredMode: input.configuredMode,
      effectiveAdapter: input.health.activeAdapter,
      checks,
      evidence,
      startedAt,
      completedAt: new Date().toISOString(),
      summary: remoteConfirmed
        ? "Persistência remota confirmada nos cenários de acceptance."
        : "Validação concluída com pendências ou falhas.",
    });
  }
}

export function createMissionPersistenceRuntimeValidator(): MissionPersistenceRuntimeValidator {
  return new MissionPersistenceRuntimeValidator();
}
