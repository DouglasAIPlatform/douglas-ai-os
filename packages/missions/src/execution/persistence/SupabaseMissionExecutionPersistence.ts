import type { SupabaseClient } from "@supabase/supabase-js";
import { MISSION_EXECUTION_TABLES } from "./MissionExecutionRowTypes";
import type { MissionExecutionEventRecord } from "./MissionExecutionEventRecord";
import type { MissionExecutionPersistenceHealth } from "./MissionExecutionPersistenceHealth";
import { DEFAULT_MISSION_EXECUTION_PERSISTENCE_HEALTH } from "./MissionExecutionPersistenceHealth";
import type { MissionExecutionPersistenceResult } from "./MissionExecutionPersistenceResult";
import {
  missionPersistenceFail,
  missionPersistenceOk,
} from "./MissionExecutionPersistenceResult";
import {
  contextToTimelineEvent,
  missionExecutionContextToRow,
  missionExecutionEventRowToRecord,
  missionExecutionEventToRow,
  missionExecutionRowToContext,
  type MissionExecutionPersistenceWriteMeta,
} from "./SupabaseMissionExecutionMapper";
import type {
  MissionExecutionContext,
  MissionExecutionResult,
} from "../MissionExecutionTypes";

export interface SupabaseMissionExecutionPersistenceConfig {
  enabled: boolean;
  executionsTable: string;
  eventsTable: string;
}

export const DEFAULT_SUPABASE_MISSION_EXECUTION_CONFIG: SupabaseMissionExecutionPersistenceConfig =
  {
    enabled: true,
    executionsTable: MISSION_EXECUTION_TABLES.executions,
    eventsTable: MISSION_EXECUTION_TABLES.events,
  };

function isMissingTableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find the table") ||
    normalized.includes("schema cache") ||
    normalized.includes("42p01") ||
    normalized.includes("pgrst205")
  );
}

function isDuplicateError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("duplicate") ||
    normalized.includes("unique") ||
    normalized.includes("23505")
  );
}

function isTerminalImmutableError(message: string): boolean {
  return message.toLowerCase().includes("mission_execution_terminal_immutable")
    || message.toLowerCase().includes("mission_execution_result_immutable");
}

export class SupabaseMissionExecutionPersistence {
  private readonly client: SupabaseClient | null;
  private readonly config: SupabaseMissionExecutionPersistenceConfig;
  private tableReady: boolean | null = null;
  private lastError: string | null = null;
  private lastPersistedAt: string | null = null;
  private lastHydratedAt: string | null = null;

  constructor(
    client: SupabaseClient | null,
    config: Partial<SupabaseMissionExecutionPersistenceConfig> = {},
  ) {
    this.client = client;
    this.config = { ...DEFAULT_SUPABASE_MISSION_EXECUTION_CONFIG, ...config };
  }

  getTableReady(): boolean | null {
    return this.tableReady;
  }

  getHealth(mode: MissionExecutionPersistenceHealth["mode"]): MissionExecutionPersistenceHealth {
    return {
      ...DEFAULT_MISSION_EXECUTION_PERSISTENCE_HEALTH,
      enabled: this.config.enabled && this.client !== null,
      mode,
      activeAdapter: this.client && this.config.enabled ? "supabase" : "none",
      supabaseConfigured: this.client !== null,
      supabaseTableReady: this.tableReady,
      lastError: this.lastError,
      lastPersistedAt: this.lastPersistedAt,
      lastHydratedAt: this.lastHydratedAt,
    };
  }

  async checkHealth(): Promise<MissionExecutionPersistenceHealth> {
    if (!this.config.enabled || !this.client) {
      this.tableReady = false;
      this.lastError = this.client ? null : "Cliente Supabase indisponível";
      return this.getHealth("session_only");
    }

    try {
      const { error } = await this.client
        .from(this.config.executionsTable)
        .select("execution_id")
        .limit(1);

      if (error) {
        this.tableReady = false;
        this.lastError = error.message;
        return this.getHealth("supabase_preferred");
      }

      this.tableReady = true;
      this.lastError = null;
      return this.getHealth("supabase_preferred");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao verificar tabelas de missão";
      this.tableReady = false;
      this.lastError = message;
      return this.getHealth("supabase_preferred");
    }
  }

  async saveExecution(
    context: MissionExecutionContext,
    meta: MissionExecutionPersistenceWriteMeta,
  ): Promise<MissionExecutionPersistenceResult> {
    if (!this.config.enabled || !this.client) {
      return missionPersistenceFail("Supabase não configurado", {
        errorCode: "not_configured",
      });
    }

    if (this.tableReady === false) {
      return missionPersistenceFail(this.lastError ?? "Tabela indisponível", {
        errorCode: "table_missing",
        tableMissing: true,
      });
    }

    const row = missionExecutionContextToRow(context, meta);
    const { error } = await this.client.from(this.config.executionsTable).upsert(row, {
      onConflict: "execution_id",
      ignoreDuplicates: false,
    });

    if (error) {
      if (isMissingTableError(error.message)) {
        this.tableReady = false;
        return missionPersistenceFail(error.message, {
          errorCode: "table_missing",
          tableMissing: true,
        });
      }
      if (isDuplicateError(error.message)) {
        return missionPersistenceFail(error.message, {
          errorCode: "duplicate_execution",
        });
      }
      this.lastError = error.message;
      return missionPersistenceFail(error.message, { errorCode: "remote_error" });
    }

    this.tableReady = true;
    this.lastPersistedAt = new Date().toISOString();
    this.lastError = null;
    return missionPersistenceOk();
  }

  async updateExecution(
    context: MissionExecutionContext,
    meta: MissionExecutionPersistenceWriteMeta,
  ): Promise<MissionExecutionPersistenceResult> {
    return this.saveExecution(context, meta);
  }

  async appendEvent(
    event: MissionExecutionEventRecord,
  ): Promise<MissionExecutionPersistenceResult> {
    if (!this.config.enabled || !this.client) {
      return missionPersistenceFail("Supabase não configurado", {
        errorCode: "not_configured",
      });
    }

    if (this.tableReady === false) {
      return missionPersistenceFail(this.lastError ?? "Tabela indisponível", {
        errorCode: "table_missing",
        tableMissing: true,
      });
    }

    const row = missionExecutionEventToRow(event);
    const { error } = await this.client.from(this.config.eventsTable).insert(row);

    if (error) {
      if (isMissingTableError(error.message)) {
        this.tableReady = false;
        return missionPersistenceFail(error.message, {
          errorCode: "table_missing",
          tableMissing: true,
        });
      }
      if (isDuplicateError(error.message)) {
        return missionPersistenceFail(error.message, {
          errorCode: "duplicate_event",
        });
      }
      if (isTerminalImmutableError(error.message)) {
        return missionPersistenceFail(error.message, {
          errorCode: "terminal_immutable",
        });
      }
      this.lastError = error.message;
      return missionPersistenceFail(error.message, { errorCode: "remote_error" });
    }

    this.lastPersistedAt = new Date().toISOString();
    return missionPersistenceOk();
  }

  async appendContextEvent(
    context: MissionExecutionContext,
    sequence: number,
    eventType: string,
    summary?: string,
  ): Promise<MissionExecutionPersistenceResult> {
    return this.appendEvent(contextToTimelineEvent(context, sequence, eventType, summary));
  }

  async getExecution(executionId: string): Promise<MissionExecutionContext | undefined> {
    if (!this.config.enabled || !this.client || this.tableReady === false) {
      return undefined;
    }

    const { data, error } = await this.client
      .from(this.config.executionsTable)
      .select("*")
      .eq("execution_id", executionId)
      .maybeSingle();

    if (error || !data) {
      if (error && isMissingTableError(error.message)) {
        this.tableReady = false;
      }
      return undefined;
    }

    this.lastHydratedAt = new Date().toISOString();
    return missionExecutionRowToContext(data);
  }

  async listRecentExecutions(limit = 20): Promise<MissionExecutionContext[]> {
    if (!this.config.enabled || !this.client || this.tableReady === false) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.config.executionsTable)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      if (error && isMissingTableError(error.message)) {
        this.tableReady = false;
      }
      return [];
    }

    this.lastHydratedAt = new Date().toISOString();
    return data.map(missionExecutionRowToContext);
  }

  async listExecutionsByAgent(
    agentId: string,
    limit = 20,
    offset = 0,
  ): Promise<MissionExecutionContext[]> {
    if (!this.config.enabled || !this.client || this.tableReady === false) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.config.executionsTable)
      .select("*")
      .eq("assigned_agent_id", agentId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      if (error && isMissingTableError(error.message)) {
        this.tableReady = false;
      }
      return [];
    }

    this.lastHydratedAt = new Date().toISOString();
    return data.map(missionExecutionRowToContext);
  }

  async listExecutionEvents(executionId: string): Promise<MissionExecutionEventRecord[]> {
    if (!this.config.enabled || !this.client || this.tableReady === false) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.config.eventsTable)
      .select("*")
      .eq("execution_id", executionId)
      .order("sequence", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(missionExecutionEventRowToRecord);
  }

  async saveResult(
    result: MissionExecutionResult,
    meta: MissionExecutionPersistenceWriteMeta,
  ): Promise<MissionExecutionPersistenceResult> {
    const saveResult = await this.saveExecution(result.context, meta);
    if (!saveResult.success) {
      return saveResult;
    }

    return this.appendContextEvent(
      result.context,
      9999,
      result.success ? "result:completed" : "result:failed",
      result.summary,
    );
  }
}

export function createSupabaseMissionExecutionPersistence(
  client: SupabaseClient | null,
  config?: Partial<SupabaseMissionExecutionPersistenceConfig>,
): SupabaseMissionExecutionPersistence {
  return new SupabaseMissionExecutionPersistence(client, config);
}
