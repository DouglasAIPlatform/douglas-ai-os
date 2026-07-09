import { DEFAULT_SUPABASE_AUDIT_TABLE } from "@douglas/audit";
import {
  DEFAULT_SUPABASE_CONFIG,
  type SupabaseConfig,
} from "@douglas/supabase";

export const supabaseConfig: SupabaseConfig = DEFAULT_SUPABASE_CONFIG;

export const supabaseHealthCheckOptions = {
  probeTable: DEFAULT_SUPABASE_AUDIT_TABLE,
} as const;
