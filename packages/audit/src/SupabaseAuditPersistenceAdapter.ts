import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isOperationalAuditEntryRow,
} from "@douglas/supabase";
import type { AuditPersistenceStatus } from "./AuditPersistenceStatus";
import {
  DEFAULT_AUDIT_PERSISTENCE_STATUS,
  syncLegacyPersistenceStatusFields,
} from "./AuditPersistenceStatus";
import type { AuditEntry, AuditPersistenceAdapter } from "./AuditTypes";
import { validateAuditEntryForIngest } from "./AuditIngestPayload";
import { invokeAuditIngestEdgeFunction } from "./SupabaseAuditEdgeInvoke";
import type { SupabaseAuditPersistenceConfig } from "./SupabaseAuditPersistenceConfig";
import { DEFAULT_SUPABASE_AUDIT_PERSISTENCE_CONFIG } from "./SupabaseAuditPersistenceConfig";
import {
  auditEntryToOperationalAuditRow,
  operationalAuditRowToAuditEntry,
} from "./SupabaseAuditRowMapper";
import type { SupabaseAuditAppendResult, SupabaseTableProbeResult } from "./SupabaseAuditResults";

export type { SupabaseAuditAppendResult, SupabaseTableProbeResult } from "./SupabaseAuditResults";

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

function buildSupabaseStatus(
  config: SupabaseAuditPersistenceConfig,
  client: SupabaseClient | null,
  overrides: Partial<AuditPersistenceStatus> = {},
): AuditPersistenceStatus {
  return syncLegacyPersistenceStatusFields({
    ...DEFAULT_AUDIT_PERSISTENCE_STATUS,
    enabled: config.enabled && client !== null,
    mode: "supabase",
    activeAdapter: config.enabled && client ? "supabase" : "none",
    supabaseConfigured: client !== null,
    supabaseWriteMode: config.writeMode,
    ...overrides,
  });
}

export class SupabaseAuditPersistenceAdapter implements AuditPersistenceAdapter {
  private readonly client: SupabaseClient | null;
  private readonly config: SupabaseAuditPersistenceConfig;
  private status: AuditPersistenceStatus;
  private tableReady: boolean | null = null;

  constructor(
    client: SupabaseClient | null,
    config: Partial<SupabaseAuditPersistenceConfig> = {},
  ) {
    this.client = client;
    this.config = { ...DEFAULT_SUPABASE_AUDIT_PERSISTENCE_CONFIG, ...config };
    this.status = buildSupabaseStatus(this.config, this.client, {
      supabaseTableReady: null,
    });
  }

  getStatus(): AuditPersistenceStatus {
    return this.status;
  }

  async probeTableReady(): Promise<SupabaseTableProbeResult> {
    if (!this.config.enabled || !this.client) {
      this.tableReady = false;
      this.status = buildSupabaseStatus(this.config, this.client, {
        supabaseTableReady: false,
        lastError: this.client ? null : "Cliente Supabase indisponível",
        fallbackUsed: true,
      });
      return {
        ready: false,
        error: this.client ? null : "Cliente Supabase indisponível",
      };
    }

    try {
      const { error } = await this.client
        .from(this.config.tableName)
        .select("id")
        .limit(1);

      if (error) {
        const tableMissing = isMissingTableError(error.message);
        this.tableReady = !tableMissing ? false : false;
        this.status = buildSupabaseStatus(this.config, this.client, {
          supabaseTableReady: false,
          lastError: error.message,
          fallbackUsed: true,
        });
        return { ready: false, error: error.message };
      }

      this.tableReady = true;
      this.status = buildSupabaseStatus(this.config, this.client, {
        supabaseTableReady: true,
        lastError: null,
      });
      return { ready: true, error: null };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao verificar tabela de audit";
      this.tableReady = false;
      this.status = buildSupabaseStatus(this.config, this.client, {
        supabaseTableReady: false,
        lastError: message,
        fallbackUsed: true,
      });
      return { ready: false, error: message };
    }
  }

  async hydrate(): Promise<AuditEntry[]> {
    if (!this.config.enabled || !this.client) {
      return [];
    }

    if (this.tableReady === false) {
      return [];
    }

    try {
      const { data, error } = await this.client
        .from(this.config.tableName)
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(200);

      if (error) {
        const tableMissing = isMissingTableError(error.message);
        this.tableReady = false;
        this.status = buildSupabaseStatus(this.config, this.client, {
          supabaseTableReady: false,
          lastHydratedAt: new Date().toISOString(),
          lastError: error.message,
          fallbackUsed: true,
        });
        return [];
      }

      this.tableReady = true;
      const entries = (data ?? [])
        .filter(isOperationalAuditEntryRow)
        .map(operationalAuditRowToAuditEntry);

      this.status = buildSupabaseStatus(this.config, this.client, {
        supabaseTableReady: true,
        persistedCount: entries.length,
        lastHydratedAt: new Date().toISOString(),
        lastError: null,
      });
      return entries;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to hydrate audit from Supabase";
      this.status = buildSupabaseStatus(this.config, this.client, {
        lastHydratedAt: new Date().toISOString(),
        lastError: message,
        fallbackUsed: true,
      });
      return [];
    }
  }

  append(entry: AuditEntry): void {
    if (!this.config.enabled || !this.client) {
      return;
    }

    if (this.config.writeMode === "direct_client" && this.tableReady === false) {
      return;
    }

    void this.appendAsync(entry);
  }

  async appendAsync(entry: AuditEntry): Promise<SupabaseAuditAppendResult> {
    if (!this.config.enabled || !this.client) {
      return {
        success: false,
        error: "Cliente Supabase indisponível",
      };
    }

    if (this.config.writeMode === "edge_function") {
      return this.appendViaEdgeFunction(entry);
    }

    return this.appendViaDirectClient(entry);
  }

  private async appendViaEdgeFunction(entry: AuditEntry): Promise<SupabaseAuditAppendResult> {
    if (!this.client) {
      return { success: false, error: "Cliente Supabase indisponível" };
    }

    const validation = validateAuditEntryForIngest(entry);
    if (!validation.valid) {
      this.status = buildSupabaseStatus(this.config, this.client, {
        lastError: validation.error,
        fallbackUsed: true,
        lastRemoteStatus: "rejected",
        lastRemoteErrorCode: validation.errorCode ?? "invalid_payload",
      });
      return { success: false, error: validation.error, errorCode: validation.errorCode };
    }

    const result = await invokeAuditIngestEdgeFunction({
      client: this.client,
      functionName: this.config.edgeFunctionName,
      payload: validation.payload,
    });

    if (!result.success) {
      this.status = buildSupabaseStatus(this.config, this.client, {
        lastError: result.error ?? "Edge Function audit-ingest falhou",
        fallbackUsed: true,
        lastRemoteStatus: result.remoteStatus ?? "error",
        lastRemoteErrorCode: result.errorCode ?? null,
        edgeFunctionNotDeployed: result.edgeFunctionNotDeployed ?? false,
      });
      return result;
    }

    this.status = buildSupabaseStatus(this.config, this.client, {
      persistedCount: this.status.persistedCount + 1,
      lastPersistedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      lastError: null,
      lastRemoteStatus: result.remoteStatus ?? "accepted",
      lastRemoteErrorCode: null,
      edgeFunctionNotDeployed: false,
    });
    return result;
  }

  private async appendViaDirectClient(entry: AuditEntry): Promise<SupabaseAuditAppendResult> {
    if (!this.client) {
      return {
        success: false,
        error: "Cliente Supabase indisponível",
      };
    }

    if (this.tableReady === false) {
      return {
        success: false,
        error: "Tabela operational_audit_entries indisponível",
        tableMissing: true,
      };
    }

    try {
      const row = auditEntryToOperationalAuditRow(entry);
      const { error } = await this.client.from(this.config.tableName).insert(row);

      if (error) {
        const tableMissing = isMissingTableError(error.message);
        if (tableMissing) {
          this.tableReady = false;
        }
        this.status = buildSupabaseStatus(this.config, this.client, {
          supabaseTableReady: tableMissing ? false : this.tableReady,
          lastError: error.message,
          fallbackUsed: true,
        });
        return {
          success: false,
          error: error.message,
          tableMissing,
        };
      }

      this.tableReady = true;
      this.status = buildSupabaseStatus(this.config, this.client, {
        supabaseTableReady: true,
        persistedCount: this.status.persistedCount + 1,
        lastPersistedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        lastError: null,
      });
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to persist audit entry";
      this.status = buildSupabaseStatus(this.config, this.client, {
        lastError: message,
        fallbackUsed: true,
      });
      return { success: false, error: message };
    }
  }

  async query(limit = 50): Promise<AuditEntry[]> {
    if (!this.config.enabled || !this.client || this.tableReady === false) {
      return [];
    }

    try {
      const { data, error } = await this.client
        .from(this.config.tableName)
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        const tableMissing = isMissingTableError(error.message);
        if (tableMissing) {
          this.tableReady = false;
        }
        this.status = buildSupabaseStatus(this.config, this.client, {
          supabaseTableReady: tableMissing ? false : this.tableReady,
          lastError: error.message,
          fallbackUsed: true,
        });
        return [];
      }

      return (data ?? [])
        .filter(isOperationalAuditEntryRow)
        .map(operationalAuditRowToAuditEntry);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to query audit entries";
      this.status = buildSupabaseStatus(this.config, this.client, {
        lastError: message,
        fallbackUsed: true,
      });
      return [];
    }
  }
}

export function createSupabaseAuditPersistenceAdapter(
  client: SupabaseClient | null,
  config?: Partial<SupabaseAuditPersistenceConfig>,
): SupabaseAuditPersistenceAdapter {
  return new SupabaseAuditPersistenceAdapter(client, config);
}
