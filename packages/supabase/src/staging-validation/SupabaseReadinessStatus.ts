/** Overall staging readiness derived from read-only validation checks. */
export type SupabaseReadinessStatus =
  | "not_configured"
  | "ready_for_migration"
  | "partially_configured"
  | "ready_for_auth"
  | "error";

export const SUPABASE_READINESS_STATUS_LABELS: Record<SupabaseReadinessStatus, string> = {
  not_configured: "Não configurado",
  ready_for_migration: "Pronto para migrations",
  partially_configured: "Parcialmente configurado",
  ready_for_auth: "Pronto para auth / operação",
  error: "Erro de validação",
};

export const SUPABASE_READINESS_STATUS_DESCRIPTIONS: Record<
  SupabaseReadinessStatus,
  string
> = {
  not_configured:
    "Variáveis Supabase ausentes — plataforma continua em modo mock/local.",
  ready_for_migration:
    "Projeto acessível — aplique migrations antes de auth/audit remoto.",
  partially_configured:
    "Parte da fundação OK — revise checks com alerta e docs de operations.",
  ready_for_auth:
    "Tabelas core detectadas — login, profiles e audit remoto podem ser validados.",
  error:
    "Falha de conexão ou auth — corrija env vars ou status do projeto Supabase.",
};
