import { createActionAuditLog, type ActionAuditLog } from "./ActionAuditLog";
import { createActionConfirmation, type ActionConfirmation } from "./ActionConfirmation";
import type { ActionPolicyContext } from "./ActionPolicy";
import { createPermissionGuard, type PermissionGuard } from "./PermissionGuard";
import type {
  ActionConfirmationRequest,
  ActionConfirmationRiskLevel,
  ActionGuardResult,
  Operator,
  SecuredActionType,
  SecurityActionEventPayload,
  SecurityRecordExtras,
} from "./SecurityTypes";
import { SECURITY_EVENT_TOPICS } from "./SecurityTypes";

export interface SecurityLayerOptions {
  guard?: PermissionGuard;
  auditLog?: ActionAuditLog;
  confirmation?: ActionConfirmation;
  publish?: (topic: string, payload: SecurityActionEventPayload) => void;
}

export class SecurityLayer {
  readonly guard: PermissionGuard;
  readonly auditLog: ActionAuditLog;
  readonly confirmation: ActionConfirmation;
  private readonly publish: (topic: string, payload: SecurityActionEventPayload) => void;

  constructor(options: SecurityLayerOptions = {}) {
    this.guard = options.guard ?? createPermissionGuard();
    this.auditLog = options.auditLog ?? createActionAuditLog();
    this.confirmation = options.confirmation ?? createActionConfirmation();
    this.publish = options.publish ?? (() => undefined);
  }

  evaluateAction(
    operator: Operator,
    moduleId: string,
    action: SecuredActionType,
    policyContext: ActionPolicyContext = {},
  ): ActionGuardResult {
    return this.guard.evaluate(operator, action, policyContext);
  }

  recordBlocked(
    operator: Operator,
    moduleId: string,
    action: SecuredActionType,
    reason: string,
    extras: SecurityRecordExtras = {},
  ): void {
    const entry = this.auditLog.recordBlocked(
      operator.id,
      operator.role,
      moduleId,
      action,
      reason,
      extras,
    );
    this.publishEvent(SECURITY_EVENT_TOPICS.blocked, operator, moduleId, action, reason, {
      auditId: entry.id,
      requestId: extras.requestId,
      correlationId: extras.correlationId,
    });
  }

  recordAllowed(
    operator: Operator,
    moduleId: string,
    action: SecuredActionType,
    extras: SecurityRecordExtras = {},
  ): void {
    const entry = this.auditLog.recordAllowed(
      operator.id,
      operator.role,
      moduleId,
      action,
      "Action permitted by security layer",
      extras,
    );
    this.publishEvent(
      SECURITY_EVENT_TOPICS.allowed,
      operator,
      moduleId,
      action,
      "Action allowed",
      {
        auditId: entry.id,
        requestId: extras.requestId,
        correlationId: extras.correlationId ?? extras.requestId,
      },
    );
  }

  recordConfirmationRequested(
    operator: Operator,
    request: ActionConfirmationRequest,
  ): void {
    const correlationId = request.id;
    const entry = this.auditLog.recordRequested(
      operator.id,
      operator.role,
      request.moduleId,
      request.action,
      request.message ?? "Confirmation requested for sensitive action",
      { requestId: request.id, correlationId },
    );

    this.publishEvent(
      SECURITY_EVENT_TOPICS.confirmationRequested,
      operator,
      request.moduleId,
      request.action,
      request.message ?? "Confirmation requested for sensitive action",
      {
        auditId: entry.id,
        requestId: request.id,
        correlationId,
        risk: request.risk,
      },
    );
  }

  recordConfirmed(
    operator: Operator,
    moduleId: string,
    action: SecuredActionType,
    extras: SecurityRecordExtras = {},
  ): void {
    const correlationId = extras.correlationId ?? extras.requestId;
    const entry = this.auditLog.recordConfirmed(
      operator.id,
      operator.role,
      moduleId,
      action,
      "Operator confirmed sensitive action",
      { ...extras, correlationId },
    );
    this.publishEvent(
      SECURITY_EVENT_TOPICS.confirmed,
      operator,
      moduleId,
      action,
      "Action confirmed",
      {
        auditId: entry.id,
        requestId: extras.requestId,
        correlationId,
      },
    );
  }

  recordCancelled(
    operator: Operator,
    moduleId: string,
    action: SecuredActionType,
    extras: SecurityRecordExtras = {},
  ): void {
    const correlationId = extras.correlationId ?? extras.requestId;
    const entry = this.auditLog.recordCancelled(
      operator.id,
      operator.role,
      moduleId,
      action,
      "Operator cancelled sensitive action",
      { ...extras, correlationId },
    );
    this.publishEvent(
      SECURITY_EVENT_TOPICS.cancelled,
      operator,
      moduleId,
      action,
      "Action cancelled",
      {
        auditId: entry.id,
        requestId: extras.requestId,
        correlationId,
      },
    );
  }

  private publishEvent(
    topic: string,
    operator: Operator,
    moduleId: string,
    action: SecuredActionType,
    message: string,
    extras: {
      auditId?: string;
      requestId?: string;
      correlationId?: string;
      risk?: ActionConfirmationRiskLevel;
    } = {},
  ): void {
    this.publish(topic, {
      auditId: extras.auditId,
      requestId: extras.requestId,
      correlationId: extras.correlationId ?? extras.requestId,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      moduleId,
      action,
      message,
      risk: extras.risk,
    });
  }
}

export function createSecurityLayer(options?: SecurityLayerOptions): SecurityLayer {
  return new SecurityLayer(options);
}
