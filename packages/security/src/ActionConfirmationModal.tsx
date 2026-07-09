"use client";

import {
  ACTION_CONFIRMATION_RISK_LABELS,
  type ActionConfirmationRequest,
} from "./SecurityTypes";

export interface ActionConfirmationModalProps {
  request: ActionConfirmationRequest;
  onConfirm: () => void;
  onCancel: () => void;
}

const RISK_STYLES: Record<ActionConfirmationRequest["risk"], string> = {
  low: "text-[var(--ds-color-text-muted)]",
  medium: "text-[var(--ds-color-text-primary)]",
  high: "font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]",
};

export function ActionConfirmationModal({
  request,
  onConfirm,
  onCancel,
}: ActionConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[var(--ds-space-4)]"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-confirmation-title"
        aria-describedby="action-confirmation-description"
        className="w-full max-w-md rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-default)] p-[var(--ds-space-5)] shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="space-y-[var(--ds-space-2)]">
          <p className="text-[length:var(--ds-font-size-xs)] uppercase tracking-wide text-[var(--ds-color-text-muted)]">
            Confirmação operacional
          </p>
          <h2
            id="action-confirmation-title"
            className="text-[length:var(--ds-font-size-lg)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]"
          >
            {request.actionLabel}
          </h2>
        </header>

        <dl
          id="action-confirmation-description"
          className="mt-[var(--ds-space-4)] space-y-[var(--ds-space-3)] text-[length:var(--ds-font-size-sm)]"
        >
          <div>
            <dt className="text-[var(--ds-color-text-muted)]">Módulo afetado</dt>
            <dd className="mt-[var(--ds-space-1)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
              {request.moduleName}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--ds-color-text-muted)]">Risco</dt>
            <dd className={`mt-[var(--ds-space-1)] ${RISK_STYLES[request.risk]}`}>
              {ACTION_CONFIRMATION_RISK_LABELS[request.risk]}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--ds-color-text-muted)]">Consequência esperada</dt>
            <dd className="mt-[var(--ds-space-1)] text-[var(--ds-color-text-primary)]">
              {request.consequence}
            </dd>
          </div>
          {request.message ? (
            <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
              <dt className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                Contexto adicional
              </dt>
              <dd className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]">
                {request.message}
              </dd>
            </div>
          ) : null}
        </dl>

        <footer className="mt-[var(--ds-space-5)] flex justify-end gap-[var(--ds-space-3)]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] px-[var(--ds-space-4)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-muted)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-4)] py-[var(--ds-space-2)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)] hover:bg-[var(--ds-color-surface-default)]"
          >
            Confirmar
          </button>
        </footer>
      </div>
    </div>
  );
}
