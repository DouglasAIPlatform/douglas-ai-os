"use client";

import { createContext } from "react";
import type { AuditLog } from "./AuditLog";
import type { AuditPersistenceStatus } from "./AuditPersistenceStatus";
import type { AuditSyncResult } from "./AuditSyncResult";
import type { AuditPendingCleanupResult } from "./AuditPendingCleanupResult";
import type { AuditEntry } from "./AuditTypes";

export interface AuditContextValue {
  auditLog: AuditLog;
  entries: AuditEntry[];
  totalCount: number;
  persistenceStatus: AuditPersistenceStatus;
  retryPendingEntries?: () => Promise<AuditSyncResult>;
  clearResolvedPendingEntries?: () => AuditPendingCleanupResult;
  clearStaleFailedPendingEntries?: () => AuditPendingCleanupResult;
}

export const AuditContext = createContext<AuditContextValue | null>(null);
