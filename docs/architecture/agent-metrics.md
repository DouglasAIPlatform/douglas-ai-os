# Agent Metrics

Sprint 5.51 — métricas operacionais derivadas do histórico de execuções de missão.

## Calculadora

`AgentExecutionMetricsCalculator` (`@douglas/agents`) agrega entradas de histórico:

```typescript
calculateAgentExecutionMetrics({ agentId, entries, scope })
buildAgentExecutionMetricsSnapshot({ agentId, entries, scope, dataSource })
```

## Métricas por agente

| Métrica | Descrição |
|---------|-----------|
| `totalExecutions` | Total de entradas no escopo |
| `completed` | Outcome `completed` |
| `failed` | Outcome `failed` |
| `cancelled` | Outcome `cancelled` |
| `interrupted` | `interrupted` + `recovery_required` |
| `successRate` | `completed / terminal` (null se amostra insuficiente) |
| `averageDurationMs` | Média de durações terminais |
| `lastDurationMs` | Duração da execução mais recente |
| `lastExecutionAt` | Timestamp da entrada mais recente |
| `lastOutcome` | Outcome da execução mais recente |
| `activeExecutions` | `running` + `assigned` |
| `missionTypesExecuted` | Tipos de missão distintos |
| `insufficientSample` | `true` quando `totalExecutions === 0` |

## Taxa de sucesso

- **Nunca** reporta 100% quando não há execuções terminais
- `successRate === null` quando `terminalEntries.length === 0`
- UI exibe `—` para amostra insuficiente

## Duração

`computeDurationMs(startedAt, completedAt)`:

- Retorna `undefined` se timestamps inválidos ou ausentes
- Média calculada apenas sobre execuções com duração conhecida

## Outcomes

`resolveAgentExecutionOutcome(status)` mapeia status de missão para outcome canônico.

Contagens via `countByOutcome(entries)`.

## Data source

O snapshot inclui origem:

- `session` — apenas sessionStorage
- `supabase` — apenas persistência remota
- `composite` — merge deduplicado
- `memory` — repositório in-memory (testes)

## Sessão vs persistido

| Fonte | Escopo | Persistência |
|-------|--------|--------------|
| `AgentSessionMetricsStore` | Sessão runtime | Memória (OperationalAgentRuntime) |
| `AgentExecutionMetricsSnapshot` | Configurável | mission_executions + sessão |

A página `/agents` prioriza métricas do repositório (combined) com indicador de origem.

## Referências

- [Agent Execution History](../agents/agent-execution-history.md)
- [Operational Agent Runtime](./operational-agent-runtime.md)
