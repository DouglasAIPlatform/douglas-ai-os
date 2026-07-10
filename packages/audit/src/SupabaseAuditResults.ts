import type { AuditIngestErrorCode, AuditIngestResponseStatus } from "./AuditIngestResponse";

export interface SupabaseAuditAppendResult {
  success: boolean;
  error?: string;
  tableMissing?: boolean;
  edgeFunctionNotDeployed?: boolean;
  remoteStatus?: AuditIngestResponseStatus;
  auditId?: string;
  requestId?: string;
  correlationId?: string;
  errorCode?: AuditIngestErrorCode;
  latencyMs?: number;
}

export interface SupabaseTableProbeResult {
  ready: boolean;
  error: string | null;
}
