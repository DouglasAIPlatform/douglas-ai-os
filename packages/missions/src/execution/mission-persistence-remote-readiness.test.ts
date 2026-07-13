import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MissionPersistenceRuntimeValidator,
  buildAcceptanceMissionContext,
  buildInitialRemoteChecks,
  evaluateMissionPersistenceFallback,
  isAcceptanceExecutionId,
  reviewMissionPersistenceMigration,
  MISSION_PERSISTENCE_ACCEPTANCE_FLAG,
} from "./persistence/remote";
import { canPerformMissionExecution } from "./MissionExecutionAccessPolicy";
import {
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
} from "./MissionExecutionTypes";
import { sanitizeMissionPersistenceText } from "./persistence/MissionExecutionSanitizer";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

function createMockSupabaseClient(options: {
  insertFails?: boolean;
  duplicateOnSecondSave?: boolean;
  duplicateEvent?: boolean;
} = {}) {
  let saveCount = 0;
  const executions: Record<string, unknown>[] = [];
  const events: Record<string, unknown>[] = [];

  const from = vi.fn((table: string) => {
    const api = {
      select: vi.fn(() => api),
      eq: vi.fn(() => api),
      order: vi.fn(() => api),
      limit: vi.fn(async () => ({ data: executions.slice(0, 1), error: null })),
      maybeSingle: vi.fn(async () => ({
        data: executions[executions.length - 1] ?? null,
        error: null,
      })),
      upsert: vi.fn(async (row: Record<string, unknown>) => {
        if (options.insertFails) {
          return { error: { message: "permission denied" } };
        }
        saveCount += 1;
        if (options.duplicateOnSecondSave && saveCount > 1 && executions.length > 0) {
          return { error: { message: "duplicate key unique violation 23505" } };
        }
        executions.push(row);
        return { error: null };
      }),
      insert: vi.fn(async (row: Record<string, unknown>) => {
        if (table.includes("events") && options.duplicateEvent) {
          const dup = events.some(
            (item) =>
              item.execution_id === row.execution_id && item.sequence === row.sequence,
          );
          if (dup) {
            return { error: { message: "duplicate key unique 23505" } };
          }
        }
        events.push(row);
        return { error: null };
      }),
    };
    return api;
  });

  return { from, executions, events } as unknown as SupabaseClient & {
    executions: Record<string, unknown>[];
    events: Record<string, unknown>[];
  };
}

describe("Remote mission persistence readiness (Sprint 5.54)", () => {
  it("report unknown antes de staging", () => {
    const report = MissionPersistenceRuntimeValidator.buildUnknownReport("development");
    expect(report.status).toBe("unknown");
    expect(report.checks.every((item) => item.status === "unknown")).toBe(true);
  });

  it("validator não executa automaticamente", () => {
    expect(MissionPersistenceRuntimeValidator.autoRun).toBe(false);
  });

  it("botão bloqueado em development — elegibilidade negada", () => {
    const eligibility = MissionPersistenceRuntimeValidator.evaluateEligibility({
      environment: "development",
      configuredMode: "supabase_preferred",
      health: {
        enabled: true,
        mode: "supabase_preferred",
        activeAdapter: "composite",
        supabaseConfigured: true,
        supabaseTableReady: true,
        fallbackActive: false,
        pendingSyncCount: 0,
        lastSyncAt: null,
        lastError: null,
        lastPersistedAt: null,
        lastHydratedAt: null,
      },
      supabaseClient: {} as SupabaseClient,
      writeMeta: { createdByUserId: "user-1" },
      role: "operator",
      profileActive: true,
      isAuthenticated: true,
    });
    expect(eligibility.allowed).toBe(false);
  });

  it("viewer bloqueado", () => {
    const eligibility = MissionPersistenceRuntimeValidator.evaluateEligibility({
      environment: "staging",
      configuredMode: "supabase_required",
      health: {
        enabled: true,
        mode: "supabase_required",
        activeAdapter: "supabase",
        supabaseConfigured: true,
        supabaseTableReady: true,
        fallbackActive: false,
        pendingSyncCount: 0,
        lastSyncAt: null,
        lastError: null,
        lastPersistedAt: null,
        lastHydratedAt: null,
      },
      supabaseClient: {} as SupabaseClient,
      writeMeta: { createdByUserId: "user-1" },
      role: "viewer",
      profileActive: true,
      isAuthenticated: true,
    });
    expect(eligibility.allowed).toBe(false);
  });

  it("profile inativo bloqueado", () => {
    const eligibility = MissionPersistenceRuntimeValidator.evaluateEligibility({
      environment: "staging",
      configuredMode: "supabase_required",
      health: {
        enabled: true,
        mode: "supabase_required",
        activeAdapter: "supabase",
        supabaseConfigured: true,
        supabaseTableReady: true,
        fallbackActive: false,
        pendingSyncCount: 0,
        lastSyncAt: null,
        lastError: null,
        lastPersistedAt: null,
        lastHydratedAt: null,
      },
      supabaseClient: {} as SupabaseClient,
      writeMeta: { createdByUserId: "user-1" },
      role: "operator",
      profileActive: false,
      isAuthenticated: true,
    });
    expect(eligibility.allowed).toBe(false);
  });

  it("owner/admin/operator conforme policy", () => {
    for (const role of ["owner", "admin", "operator"] as const) {
      expect(
        canPerformMissionExecution({
          role,
          missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
          capability: "execute",
        }),
      ).toBe(true);
    }
    expect(
      canPerformMissionExecution({
        role: "viewer",
        missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
        capability: "execute",
      }),
    ).toBe(false);
  });

  it("operational_diagnostic e release_readiness_review aceitos no test data policy", () => {
    const diagnostic = buildAcceptanceMissionContext({
      missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
      createdBy: "op",
      createdByUserId: "user-1",
      createdByRole: "operator",
    });
    const release = buildAcceptanceMissionContext({
      missionType: RELEASE_READINESS_REVIEW_MISSION_TYPE,
      createdBy: "op",
      createdByUserId: "user-1",
      createdByRole: "operator",
    });
    expect(isAcceptanceExecutionId(diagnostic.executionId)).toBe(true);
    expect(isAcceptanceExecutionId(release.executionId)).toBe(true);
  });

  it("tipo desconhecido não entra na policy de acceptance", () => {
    const ctx = buildAcceptanceMissionContext({
      missionType: "invalid_probe",
      createdBy: "op",
      createdByUserId: "user-1",
      createdByRole: "operator",
    });
    expect(ctx.request.missionType).toBe("invalid_probe");
  });

  it("fallback detectado em staging", () => {
    const evalResult = evaluateMissionPersistenceFallback({
      environment: "staging",
      configuredMode: "supabase_required",
      effectiveMode: "supabase_required",
      fallbackActive: true,
      pendingSyncCount: 0,
    });
    expect(evalResult.stagingBlocker).toBe(true);
    expect(evalResult.severity).toBe("blocker");
  });

  it("development permite fallback", () => {
    const evalResult = evaluateMissionPersistenceFallback({
      environment: "development",
      configuredMode: "supabase_preferred",
      effectiveMode: "supabase_preferred",
      fallbackActive: true,
      pendingSyncCount: 2,
    });
    expect(evalResult.stagingBlocker).toBe(false);
    expect(evalResult.severity).not.toBe("blocker");
  });

  it("pending queue detectada", () => {
    const evalResult = evaluateMissionPersistenceFallback({
      environment: "staging",
      configuredMode: "supabase_required",
      effectiveMode: "supabase_required",
      fallbackActive: false,
      pendingSyncCount: 3,
    });
    expect(evalResult.pendingSyncCount).toBe(3);
    expect(evalResult.stagingBlocker).toBe(true);
  });

  it("duplicidade detectada via validator mock", async () => {
    const client = createMockSupabaseClient({ duplicateOnSecondSave: true });
    const validator = new MissionPersistenceRuntimeValidator();
    const report = await validator.runSafeAcceptance({
      environment: "staging",
      configuredMode: "supabase_required",
      health: {
        enabled: true,
        mode: "supabase_required",
        activeAdapter: "supabase",
        supabaseConfigured: true,
        supabaseTableReady: true,
        fallbackActive: false,
        pendingSyncCount: 0,
        lastSyncAt: null,
        lastError: null,
        lastPersistedAt: null,
        lastHydratedAt: null,
      },
      supabaseClient: client,
      writeMeta: { createdByUserId: "user-1" },
      role: "operator",
      profileActive: true,
      isAuthenticated: true,
    });

    const dupCheck = report.checks.find((item) => item.id === "duplicate_execution_rejected");
    expect(dupCheck?.status).toBe("passed");
  });

  it("payload sanitizado — sem e-mail ou token", () => {
    const ctx = buildAcceptanceMissionContext({
      missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
      createdBy: "user@test.com",
      createdByUserId: "user-1",
      createdByRole: "operator",
    });
    expect(JSON.stringify(ctx)).not.toContain("@test.com");
    expect(ctx.resultSummary).toContain(MISSION_PERSISTENCE_ACCEPTANCE_FLAG);
    expect(sanitizeMissionPersistenceText(
      "Falha user@test.com token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def",
    )).not.toContain("eyJ");
  });

  it("eventos de validação tipados", () => {
    const typedEvents = readFileSync(
      join(repoRoot, "packages/events/src/MissionPersistenceEventTypes.ts"),
      "utf8",
    );
    expect(typedEvents).toContain("mission:persistence_validation_started");
    expect(typedEvents).toContain("mission:persistence_validation_passed");
    expect(typedEvents).toContain("mission:persistence_validation_failed");
    expect(typedEvents).toContain("mission:persistence_remote_confirmed");
  });

  it("nenhum service_role no frontend validator", () => {
    const path = join(
      repoRoot,
      "packages/missions/src/execution/persistence/remote/MissionPersistenceRuntimeValidator.ts",
    );
    const content = readFileSync(path, "utf8");
    expect(content.toLowerCase()).not.toMatch(/supabase_service_role|service_role_key/);
  });

  it("migration review estático passa na migration 20250710210000", () => {
    const sql = readFileSync(
      join(repoRoot, "supabase/migrations/20250710210000_mission_executions.sql"),
      "utf8",
    );
    const review = reviewMissionPersistenceMigration(sql);
    expect(review.passed).toBe(true);
  });

  it("status não avança para ready sem runtime — checks iniciam unknown", () => {
    const checks = buildInitialRemoteChecks();
    expect(checks.length).toBeGreaterThanOrEqual(14);
    expect(checks.every((item) => item.status === "unknown")).toBe(true);
  });

  it("widget desabilita validação em development", () => {
    const widget = readFileSync(
      join(repoRoot, "apps/headquarters/components/widgets/MissionExecutionWidget.tsx"),
      "utf8",
    );
    expect(widget).toContain("Validação remota disponível apenas em staging");
    expect(widget).toContain("disabled={!remoteValidation.eligibility.allowed");
  });
});
