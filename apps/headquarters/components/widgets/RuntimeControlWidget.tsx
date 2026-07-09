"use client";

import { useBootDiagnostics } from "@douglas/diagnostics";
import {
  buildActionConfirmationInput,
  OPERATOR_ROLE_LABELS,
  type OperatorRole,
  type SecuredActionType,
  useActionConfirmation,
  useOperator,
} from "@douglas/security";
import { OPERATOR_ROLE_SOURCE_LABELS } from "@douglas/supabase";
import {
  RUNTIME_ACTION_LABELS,
  RUNTIME_MODULE_STATUS_LABELS,
  useRuntimeControl,
  type RuntimeActionType,
} from "@douglas/runtime";
import { useState } from "react";
import {
  findSecuredAction,
  useSecuredRuntimeActions,
} from "@/features/platform-security";
import type { WidgetStateProps } from "./shared/WidgetFrame";
import { WidgetFrame } from "./shared/WidgetFrame";

export type RuntimeControlWidgetProps = WidgetStateProps;

const MOCK_ROLES: OperatorRole[] = ["owner", "admin", "operator", "viewer"];

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RuntimeControlWidget({
  isLoading: externalLoading,
  error: externalError,
}: RuntimeControlWidgetProps) {
  const { modules, lastCommand, lastResult, executeAction, isExecuting } =
    useRuntimeControl();
  const { actions: securedActions } = useSecuredRuntimeActions();
  const { operator, role, setMockRole, mockRoleChangeAllowed, operatorSource, security, auditLog } =
    useOperator();
  const { requestConfirmation } = useActionConfirmation();
  const { report: diagnosticsReport } = useBootDiagnostics();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const isLoading = externalLoading ?? false;
  const error = externalError ?? null;
  const readinessBlocked = diagnosticsReport?.ready === false;
  const lastAudit = auditLog.getLastEntry();

  const handleAction = async (moduleId: string, action: RuntimeActionType) => {
    const secured = findSecuredAction(securedActions, moduleId, action as SecuredActionType);

    if (!secured) return;

    if (secured.blockedByPermission || !secured.permissionAllowed) {
      security.recordBlocked(
        operator,
        moduleId,
        action as SecuredActionType,
        secured.reason ?? "Permissão insuficiente",
      );
      return;
    }

    if (!secured.available) return;

    let confirmationCorrelationId: string | undefined;

    if (secured.requiresConfirmation) {
      const moduleName = modules.find((module) => module.id === moduleId)?.name ?? moduleId;
      const confirmationInput = buildActionConfirmationInput(
        action as SecuredActionType,
        moduleId,
        moduleName,
        RUNTIME_ACTION_LABELS[action],
        secured.reason,
      );
      const result = await requestConfirmation(confirmationInput);

      if (!result.confirmed) {
        return;
      }

      confirmationCorrelationId = result.requestId;
    }

    security.recordAllowed(operator, moduleId, action as SecuredActionType, {
      requestId: confirmationCorrelationId,
      correlationId: confirmationCorrelationId,
    });

    setActiveModuleId(moduleId);
    await executeAction(moduleId, action);
    setActiveModuleId(null);
  };

  return (
    <WidgetFrame
      title="Runtime Control"
      description="Ações operacionais simuladas — protegidas por PermissionGuard"
      isLoading={isLoading}
      error={error}
      isEmpty={!modules.length}
      emptyTitle="Runtime não disponível"
      emptyDescription="Aguardando inicialização do runtime."
      footer={
        lastResult
          ? `Último: ${RUNTIME_ACTION_LABELS[lastResult.action]} · ${lastResult.success ? "OK" : "Falhou"} · ${lastResult.durationMs}ms`
          : undefined
      }
    >
      <div className="space-y-[var(--ds-space-4)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
          <div className="text-[length:var(--ds-font-size-xs)]">
            <p className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Operador efetivo: {operator.name}
            </p>
            <p className="mt-[var(--ds-space-1)] text-[var(--ds-color-text-muted)]">
              Role {OPERATOR_ROLE_LABELS[role]} · {OPERATOR_ROLE_SOURCE_LABELS[operatorSource]} ·
              PermissionGuard ativo
            </p>
          </div>
          <label className="flex items-center gap-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            Mock role
            <select
              value={role}
              onChange={(event) => setMockRole(event.target.value as OperatorRole)}
              disabled={!mockRoleChangeAllowed || operatorSource === "auth_profile"}
              className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-default)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[var(--ds-color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {MOCK_ROLES.map((mockRoleOption) => (
                <option key={mockRoleOption} value={mockRoleOption}>
                  {OPERATOR_ROLE_LABELS[mockRoleOption]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {readinessBlocked ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)]">
            <p className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Gate de readiness ativo
            </p>
            <p className="mt-[var(--ds-space-1)] text-[var(--ds-color-text-muted)]">
              {diagnosticsReport?.status === "not_ready"
                ? "Plataforma não pronta — pause, resume e restart bloqueados até resolver problemas críticos."
                : "Plataforma degradada — ações destrutivas exigem confirmação."}
            </p>
          </div>
        ) : null}

        {lastAudit ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)]">
            <p className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Último evento de segurança
            </p>
            <p className="mt-[var(--ds-space-1)] capitalize text-[var(--ds-color-text-muted)]">
              {lastAudit.outcome} — {RUNTIME_ACTION_LABELS[lastAudit.action]} em{" "}
              {lastAudit.moduleId} · {formatTime(lastAudit.timestamp)}
            </p>
          </div>
        ) : null}

        {lastCommand && lastResult ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)]">
            <p className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              Último comando
            </p>
            <p className="mt-[var(--ds-space-1)] text-[var(--ds-color-text-muted)]">
              {RUNTIME_ACTION_LABELS[lastResult.action]} em {lastResult.moduleId} às{" "}
              {formatTime(lastResult.completedAt)} — {lastResult.message}
            </p>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-[length:var(--ds-font-size-xs)]">
            <thead>
              <tr className="border-b border-[var(--ds-color-border-subtle)] text-[var(--ds-color-text-muted)]">
                <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                  Módulo
                </th>
                <th className="pb-[var(--ds-space-2)] pr-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)]">
                  Status
                </th>
                <th className="pb-[var(--ds-space-2)] font-[var(--ds-font-weight-medium)]">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => {
                const isBusy = isExecuting && activeModuleId === module.id;
                const moduleActions = securedActions.filter(
                  (entry) => entry.moduleId === module.id,
                );

                return (
                  <tr
                    key={module.id}
                    className="border-b border-[var(--ds-color-border-subtle)] last:border-0"
                  >
                    <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] text-[var(--ds-color-text-primary)]">
                      {module.name}
                    </td>
                    <td className="py-[var(--ds-space-2)] pr-[var(--ds-space-3)] capitalize text-[var(--ds-color-text-muted)]">
                      {RUNTIME_MODULE_STATUS_LABELS[module.status]}
                    </td>
                    <td className="py-[var(--ds-space-2)]">
                      <div className="flex flex-wrap gap-[var(--ds-space-2)]">
                        {moduleActions.map((action) => {
                          const blocked = action.blockedByPermission || !action.available;
                          const title =
                            action.reason ??
                            (action.blockedByPermission
                              ? "Bloqueado por permissão"
                              : undefined);

                          return (
                            <button
                              key={action.action}
                              type="button"
                              disabled={blocked || isBusy}
                              title={title}
                              onClick={() => handleAction(module.id, action.action)}
                              className={`rounded-[var(--ds-radius-md)] border px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] disabled:cursor-not-allowed disabled:opacity-50 ${
                                action.blockedByPermission
                                  ? "border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-muted)] line-through"
                                  : "border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-primary)]"
                              } ${
                                action.requiresConfirmation && action.available
                                  ? "ring-1 ring-[var(--ds-color-border-subtle)]"
                                  : ""
                              }`}
                            >
                              {action.label}
                              {action.blockedByPermission ? " 🔒" : null}
                              {action.requiresConfirmation && action.available ? " ⚠" : null}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Ações simuladas — PermissionGuard + confirmação operacional + audit log. Operador efetivo
          via auth profile quando disponível; fallback mock em dev.
        </p>
      </div>
    </WidgetFrame>
  );
}
