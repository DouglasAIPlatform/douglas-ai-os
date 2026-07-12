/** Política de retenção e paginação — Sprint 5.51 (sem exclusão remota automática). */

export interface AgentExecutionRetentionPolicy {
  /** Máximo de entradas por página no browser. */
  defaultPageSize: number;
  /** Máximo absoluto carregado em uma consulta. */
  maxPageSize: number;
  /** Limite padrão para listRecent. */
  defaultRecentLimit: number;
  /** Máximo de entradas mantidas em memória/sessão. */
  sessionMemoryLimit: number;
}

export const DEFAULT_AGENT_EXECUTION_RETENTION_POLICY: AgentExecutionRetentionPolicy =
  {
    defaultPageSize: 10,
    maxPageSize: 50,
    defaultRecentLimit: 20,
    sessionMemoryLimit: 100,
  };

export function resolvePageLimit(
  requested: number | undefined,
  policy: AgentExecutionRetentionPolicy = DEFAULT_AGENT_EXECUTION_RETENTION_POLICY,
): number {
  const base = requested ?? policy.defaultPageSize;
  return Math.min(Math.max(1, base), policy.maxPageSize);
}

export function resolvePageOffset(offset: number | undefined): number {
  return Math.max(0, offset ?? 0);
}

/** Registros antigos além do limite são truncados na UI — sem DELETE remoto nesta sprint. */
export function truncateToRetentionLimit<T>(
  items: T[],
  limit: number,
): T[] {
  return items.slice(0, limit);
}
