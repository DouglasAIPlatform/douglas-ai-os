"use client";

import { createContext } from "react";
import type { AuditLog } from "./AuditLog";
import type { AuditPersistenceStatus } from "./AuditPersistenceStatus";
import type { AuditSyncResult } from "./AuditSyncResult";
import type { AuditEntry } from "./AuditTypes";

export interface AuditContextValue {
  auditLog: AuditLog;
  entries: AuditEntry[];
  totalCount: number;
  persistenceStatus: AuditPersistenceStatus;
  retryPendingEntries?: () => Promise<AuditSyncResult>;
}

export const AuditContext = createContext<AuditContextValue | null>(null);
