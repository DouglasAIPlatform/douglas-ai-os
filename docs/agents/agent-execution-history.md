# Agent Execution History

Sprint 5.51 — histórico operacional por agente derivado de `mission_executions`.

## Fonte dos dados

O histórico **não duplica** resultados em tabela separada. Cada entrada é mapeada a partir de `MissionExecutionContext` persistido em `mission_executions`:

| Campo histórico | Origem |
|----------------|--------|
| `agentId` | `assigned_agent_id` / `assignedAgentId` |
| `missionType` | `request.missionType` |
| `executionId` | `execution_id` |
| `outcome` | `status` normalizado |
| `attempt`, `progress` | contexto da execução |
| `resultSummary`, `sanitizedError` | resumo sanitizado |
| `durationMs` | `completed_at - started_at` |
| `correlationId` | abreviado na UI |

## Contratos (`@douglas/agents`)

- `AgentExecutionHistoryEntry` — linha de histórico
- `AgentExecutionHistoryQuery` / `AgentExecutionHistoryPage` — consulta paginada
- `AgentExecutionMetrics` / `AgentExecutionMetricsSnapshot` — métricas agregadas
- `AgentExecutionHistoryRepository` — interface do repositório
- `AgentExecutionHistoryScope` — `session` | `persisted` | `combined`

## Scopes

| Scope | Descrição |
|-------|-----------|
| `session` | Apenas `sessionStorage` (execuções da aba atual) |
| `persisted` | Supabase (`mission_executions`) |
| `combined` | União deduplicada por `executionId` (preferência mais recente) |

## Repositório

Implementações em `@douglas/missions`:

- `InMemoryAgentExecutionHistoryRepository` — testes
- `SessionAgentExecutionHistoryRepository` — leitura síncrona de sessão
- `PersistedAgentExecutionHistoryRepository` — Supabase via adapter
- `CompositeAgentExecutionHistoryRepository` — merge com fallback

Factory: `createCompositeAgentExecutionHistoryRepository`.

## Headquarters

- **Provider:** `AgentExecutionHistoryProvider` em `MissionExecutionIntegration`
- **Hook:** `useAgentExecutionHistory(agentId)` — paginação, métricas, scopes
- **Página `/agents`:** métricas + tabela de histórico
- **Widget HQ:** resumo (agentes registrados, execuções/falhas recentes, persistência)

## Paginação

- Padrão: 10 entradas por página (`DEFAULT_AGENT_EXECUTION_RETENTION_POLICY`)
- Máximo: 50 por consulta
- `loadMore` incrementa offset — histórico ilimitado **não** é carregado no browser

## Eventos

| Tópico | Quando |
|--------|--------|
| `agent:history_rehydrated` | Após bootstrap/reidratação |
| `agent:metrics_updated` | Após refresh de métricas |
| `agent:history_load_failed` | Falha de leitura |

Todos incluem `audited: true` para evitar loops de audit.

## Limitações atuais

- Apenas `system-diagnostics-agent` possui runtime operacional
- Métricas de amostra usam até 100 entradas no escopo combined
- Sem exclusão remota automática (ver retention policy)
- UID, e-mail e tokens não são exibidos na UI

## Referências

- [Agent Metrics](../architecture/agent-metrics.md)
- [Agent History Runbook](../operations/agent-history-runbook.md)
- [Mission Persistence](../architecture/mission-persistence.md)
