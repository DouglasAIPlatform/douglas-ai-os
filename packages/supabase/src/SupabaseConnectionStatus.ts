export type SupabaseConnectionStatus =
  | "not_configured"
  | "configured"
  | "connected"
  | "error";

export interface SupabaseConnectionState {
  status: SupabaseConnectionStatus;
  message: string;
  lastCheckedAt: string | null;
  error: string | null;
}

export const SUPABASE_CONNECTION_STATUS_LABELS: Record<
  SupabaseConnectionStatus,
  string
> = {
  not_configured: "Não configurado",
  configured: "Configurado",
  connected: "Conectado",
  error: "Erro",
};

export const DEFAULT_SUPABASE_CONNECTION_STATE: SupabaseConnectionState = {
  status: "not_configured",
  message: "Variáveis Supabase não definidas.",
  lastCheckedAt: null,
  error: null,
};
