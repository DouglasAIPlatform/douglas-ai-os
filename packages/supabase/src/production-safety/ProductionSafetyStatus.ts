/** Status agregado do Production Safety Gate (Sprint 5.34). */
export type ProductionSafetyStatus =
  | "not_ready"
  | "ready_for_staging"
  | "ready_for_production_review"
  | "blocked";

export const PRODUCTION_SAFETY_STATUS_LABELS: Record<ProductionSafetyStatus, string> = {
  not_ready: "Não pronto",
  ready_for_staging: "Pronto para staging",
  ready_for_production_review: "Pronto para revisão de produção",
  blocked: "Bloqueado",
};

export const PRODUCTION_SAFETY_STATUS_DESCRIPTIONS: Record<ProductionSafetyStatus, string> = {
  not_ready:
    "Fundamentos ausentes — configure Supabase, migrations ou auth antes de avançar.",
  ready_for_staging:
    "Base operacional OK para staging; resolva alertas antes de produção.",
  ready_for_production_review:
    "Todos os checks obrigatórios passaram — revisão humana ainda necessária.",
  blocked:
    "Risco de segurança ou configuração crítica — corrija itens bloqueantes antes de continuar.",
};
