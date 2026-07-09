import type { SupabaseEnvironment } from "./SupabaseEnvironment";
import { resolveSupabaseEnvironment } from "./SupabaseEnvironment";

export interface SupabaseConfig {
  url: string | null;
  anonKey: string | null;
  /** True when URL and anon key are present and syntactically valid. */
  isConfigured: boolean;
  environment: SupabaseEnvironment;
}

export interface SupabaseEnvInput {
  url?: string | null;
  anonKey?: string | null;
  environment?: SupabaseEnvironment;
}

function readEnvValue(value: string | undefined | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function resolveSupabaseConfig(input: SupabaseEnvInput = {}): SupabaseConfig {
  const url =
    readEnvValue(input.url) ??
    readEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey =
    readEnvValue(input.anonKey) ??
    readEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const environment = input.environment ?? resolveSupabaseEnvironment();

  const isConfigured =
    url !== null &&
    anonKey !== null &&
    isValidSupabaseUrl(url) &&
    anonKey.length > 20;

  return {
    url,
    anonKey,
    isConfigured,
    environment,
  };
}

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = resolveSupabaseConfig();
