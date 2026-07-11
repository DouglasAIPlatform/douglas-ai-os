# System Diagnostics Agent

Sprint 5.49 — primeiro agente operacional read-only da Douglas AI OS.

## Identidade

| Campo | Valor |
|-------|-------|
| ID | `system-diagnostics-agent` |
| Nome | System Diagnostics Agent |
| Departamento | `intelligence` |
| Versão | `1.0.0` |
| Modo | **Read-only** (sem mutações, shell ou rede externa) |

## Capabilities

- `platform:diagnostics` — missão principal de diagnóstico operacional
- `runtime:inspect` — snapshot do Platform Runtime
- `health:inspect` — Health Engine
- `dependencies:inspect` — Dependency Graph
- `events:inspect` — Live Event Monitor
- `audit:summary` — observabilidade de audit (resumo sanitizado)

### Capabilities proibidas (não atribuídas)

Deploy, migration, delete, secret access, shell execution, role escalation, alteração de configurações críticas.

## Missão suportada

Tipo: `operational_diagnostic`

Requisito: capability `platform:diagnostics`

Fluxo:

```
Operador → MissionExecutionCoordinator → DiagnosticMissionExecutor
  → OperationalAgentRuntime (capability match)
  → SystemDiagnosticsAgent
  → relatório determinístico
```

## Fontes de dados

O agente **consome** contratos públicos existentes via `OperationalSnapshotSource`:

- Platform Runtime
- Health Engine
- Dependency Graph
- Live Event Monitor
- Production Safety Gate (quando disponível)
- Audit observability snapshot
- Environment snapshot
- Release snapshot

Não duplica engines. Não persiste dados sensíveis.

## Relatório (`AgentExecutionReport`)

Campos produzidos:

- `overallStatus` — healthy | degraded | critical | unknown
- `healthyModules`, `alertModules`, `criticalModules`
- `dependencyIssues`, `recentOperationalEvents`
- `auditState`, `currentEnvironment`, `readiness`
- `identifiedRisks`, `recommendations`
- `timestamp`, `executionId`, `correlationId`

### Sanitização

O relatório **não inclui**: tokens, secrets, URLs completas, anon keys, e-mail, UID, payload completo de eventos ou stack traces sensíveis.

## Métricas de sessão

Por agente (`AgentSessionMetrics`):

- `executions`, `completed`, `failed`, `cancelled`
- `averageDurationMs`, `lastExecutionAt`, `lastOutcome`

Armazenadas em memória na sessão HQ — não persistidas no banco nesta sprint.

## Segurança

- `AgentExecutionSafetyPolicy` bloqueia capabilities destrutivas
- `AgentCapabilityMatcher` rejeita missões incompatíveis ou agente ocupado
- Eventos `agent:*` publicados com `audited: true` para evitar loop de audit

## Limitações (Sprint 5.49)

- Um único agente operacional implementado
- Sem IA externa
- Sem execução de comandos OS
- Sem deploy ou migrations
- Snapshot depende do estado live do Headquarters

## Registrar o próximo agente

1. Definir manifest em `OperationalAgentTypes.ts` (id, capabilities, `readOnly`, `supportedMissionTypes`)
2. Validar capabilities com `validateAgentCapabilitiesSafe`
3. Implementar executor read-only consumindo snapshots/interfaces existentes
4. Registrar no `OperationalAgentRegistry` / runtime bootstrap
5. Criar executor de missão ou estender matcher para novo `missionType`
6. Adicionar eventos, testes, release checks e documentação

Ver também: [Operational Agent Runtime](../architecture/operational-agent-runtime.md).
