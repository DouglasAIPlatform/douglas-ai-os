import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "./SupabaseConfig";
import type { SupabaseConnectionState } from "./SupabaseConnectionStatus";
import { DEFAULT_SUPABASE_CONNECTION_STATE } from "./SupabaseConnectionStatus";

export interface SupabaseHealthCheckOptions {
  /** Optional table probe — fails safely if table does not exist yet. */
  probeTable?: string;
}

function notConfiguredState(config: SupabaseConfig): SupabaseConnectionState {
  return {
    ...DEFAULT_SUPABASE_CONNECTION_STATE,
    message:
      config.environment === "local"
        ? "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local."
        : "Configure as variáveis Supabase no painel da Vercel.",
  };
}

function configuredState(message: string): SupabaseConnectionState {
  return {
    status: "configured",
    message,
    lastCheckedAt: new Date().toISOString(),
    error: null,
  };
}

export async function runSupabaseHealthCheck(
  client: SupabaseClient | null,
  config: SupabaseConfig,
  options: SupabaseHealthCheckOptions = {},
): Promise<SupabaseConnectionState> {
  if (!config.isConfigured) {
    return notConfiguredState(config);
  }

  if (!client) {
    return {
      status: "error",
      message: "Cliente Supabase indisponível.",
      lastCheckedAt: new Date().toISOString(),
      error: "Failed to initialize Supabase client",
    };
  }

  try {
    const { error: authError } = await client.auth.getSession();

    if (authError) {
      return {
        status: "error",
        message: "Falha ao contactar Supabase Auth.",
        lastCheckedAt: new Date().toISOString(),
        error: authError.message,
      };
    }

    if (options.probeTable) {
      const { error: tableError } = await client
        .from(options.probeTable)
        .select("id")
        .limit(1);

      if (tableError) {
        return {
          status: "configured",
          message: `Supabase acessível, mas a tabela "${options.probeTable}" ainda não existe. Migration pendente.`,
          lastCheckedAt: new Date().toISOString(),
          error: tableError.message,
        };
      }
    }

    return {
      status: "connected",
      message: options.probeTable
        ? `Conectado — tabela "${options.probeTable}" disponível.`
        : "Conectado ao Supabase (Auth API respondendo). Autenticação real ainda não ativada.",
      lastCheckedAt: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Erro inesperado ao verificar Supabase.",
      lastCheckedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown Supabase health error",
    };
  }
}
