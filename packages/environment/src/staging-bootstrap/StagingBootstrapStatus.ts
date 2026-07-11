/** Estado operacional do bootstrap de staging — sem dependência de Supabase remoto. */
export type StagingBootstrapStatus =
  | "not_configured"
  | "configuration_incomplete"
  | "ready_for_validation"
  | "validated";

export const STAGING_BOOTSTRAP_STATUS_LABELS: Record<StagingBootstrapStatus, string> = {
  not_configured: "Staging não configurado",
  configuration_incomplete: "Configuração incompleta",
  ready_for_validation: "Pronto para validação runtime",
  validated: "Validado",
};
