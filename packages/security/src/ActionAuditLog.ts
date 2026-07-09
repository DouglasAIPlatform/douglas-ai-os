import type {
  ActionAuditEntry,
  OperatorRole,
  SecuredActionType,
} from "./SecurityTypes";

const AUDIT_CAPACITY = 50;

let auditCounter = 0;

export class ActionAuditLog {
  private entries: ActionAuditEntry[] = [];

  record(entry: Omit<ActionAuditEntry, "id" | "timestamp">): ActionAuditEntry {
    auditCounter += 1;
    const full: ActionAuditEntry = {
      ...entry,
      id: `audit-${auditCounter}`,
      timestamp: new Date().toISOString(),
    };
    this.entries = [full, ...this.entries].slice(0, AUDIT_CAPACITY);
    return full;
  }

  recordBlocked(
    operatorId: string,
    operatorRole: OperatorRole,
    moduleId: string,
    action: SecuredActionType,
    message: string,
    extras: { requestId?: string; correlationId?: string } = {},
  ): ActionAuditEntry {
    return this.record({
      operatorId,
      operatorRole,
      moduleId,
      action,
      outcome: "blocked",
      message,
      requestId: extras.requestId,
      correlationId: extras.correlationId,
    });
  }

  recordAllowed(
    operatorId: string,
    operatorRole: OperatorRole,
    moduleId: string,
    action: SecuredActionType,
    message: string,
    extras: { requestId?: string; correlationId?: string } = {},
  ): ActionAuditEntry {
    return this.record({
      operatorId,
      operatorRole,
      moduleId,
      action,
      outcome: "allowed",
      message,
      requestId: extras.requestId,
      correlationId: extras.correlationId,
    });
  }

  recordConfirmed(
    operatorId: string,
    operatorRole: OperatorRole,
    moduleId: string,
    action: SecuredActionType,
    message: string,
    extras: { requestId?: string; correlationId?: string } = {},
  ): ActionAuditEntry {
    return this.record({
      operatorId,
      operatorRole,
      moduleId,
      action,
      outcome: "confirmed",
      message,
      requestId: extras.requestId,
      correlationId: extras.correlationId ?? extras.requestId,
    });
  }

  recordCancelled(
    operatorId: string,
    operatorRole: OperatorRole,
    moduleId: string,
    action: SecuredActionType,
    message: string,
    extras: { requestId?: string; correlationId?: string } = {},
  ): ActionAuditEntry {
    return this.record({
      operatorId,
      operatorRole,
      moduleId,
      action,
      outcome: "cancelled",
      message,
      requestId: extras.requestId,
      correlationId: extras.correlationId ?? extras.requestId,
    });
  }

  recordRequested(
    operatorId: string,
    operatorRole: OperatorRole,
    moduleId: string,
    action: SecuredActionType,
    message: string,
    extras: { requestId?: string; correlationId?: string } = {},
  ): ActionAuditEntry {
    return this.record({
      operatorId,
      operatorRole,
      moduleId,
      action,
      outcome: "requested",
      message,
      requestId: extras.requestId,
      correlationId: extras.correlationId ?? extras.requestId,
    });
  }

  getEntries(limit = 20): ActionAuditEntry[] {
    return this.entries.slice(0, limit);
  }

  getLastEntry(): ActionAuditEntry | null {
    return this.entries[0] ?? null;
  }
}

export function createActionAuditLog(): ActionAuditLog {
  return new ActionAuditLog();
}
