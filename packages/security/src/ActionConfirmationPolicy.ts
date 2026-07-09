import type {
  ActionConfirmationRequestInput,
  ActionConfirmationRiskLevel,
  SecuredActionType,
} from "./SecurityTypes";

const ACTION_CONFIRMATION_DETAILS: Record<
  SecuredActionType,
  { risk: ActionConfirmationRiskLevel; consequence: string }
> = {
  restart_module: {
    risk: "high",
    consequence:
      "O módulo será reiniciado. Conexões ativas podem ser interrompidas e o serviço ficará indisponível durante o ciclo de restart.",
  },
  pause_module: {
    risk: "medium",
    consequence:
      "O módulo será pausado. Novas operações serão bloqueadas até retomada manual.",
  },
  resume_module: {
    risk: "medium",
    consequence:
      "O módulo será retomado. Operações pausadas voltarão a ser processadas.",
  },
  refresh_module: {
    risk: "low",
    consequence: "Estado interno do módulo será atualizado sem interrupção prolongada.",
  },
  run_health_check: {
    risk: "low",
    consequence: "Um health check será executado. Sem alteração de estado operacional.",
  },
};

export function buildActionConfirmationInput(
  action: SecuredActionType,
  moduleId: string,
  moduleName: string,
  actionLabel: string,
  message?: string,
): ActionConfirmationRequestInput {
  const details = ACTION_CONFIRMATION_DETAILS[action];

  return {
    moduleId,
    moduleName,
    action,
    actionLabel,
    risk: details.risk,
    consequence: details.consequence,
    message,
  };
}
