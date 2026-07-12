# Operational Agent Runtime

Sprint 5.49 — runtime determinístico para agentes operacionais read-only.

## Visão geral

```
MissionExecutionCoordinator
  → DiagnosticMissionExecutor | ReleaseReadinessMissionExecutor
  → OperationalAgentRuntime.resolveAssignment()
  → AgentCapabilityMatcher
  → SystemDiagnosticsAgent | ReleaseReadinessAgent
  → AgentExecutionReport | ReleaseReadinessAgentReport
  → MissionExecutionResult + Timeline + Audit
```

O coordinator **não** depende da implementação concreta do agente — usa registry e resolver.

## Contratos principais

| Tipo | Responsabilidade |
|------|------------------|
| `OperationalAgent` | Identidade + status runtime |
| `OperationalAgentManifest` | Metadados registráveis (capabilities, versão, readOnly) |
| `AgentExecutionRequest` | Pedido de execução (missionId, executionId, correlationId) |
| `AgentExecutionContext` | Estado durante execução (progress, steps, timestamps) |
| `AgentExecutionResult` | Sucesso/falha + relatório opcional |
| `AgentExecutionReport` | Relatório sanitizado determinístico |
| `AgentExecutionError` | Erro controlado com mensagem sanitizada |
| `AgentRuntimeStatus` | idle, assigned, running, completed, failed, cancelled, unavailable |

Pacote: `@douglas/agents` → `packages/agents/src/operational/`

## Componentes

### OperationalAgentRegistry

Registra manifests, status runtime e último relatório por agente.

### OperationalAgentRuntime

- Resolve assignment via matcher
- Executa agentes suportados: `system-diagnostics-agent`, `release-readiness-agent`
- Publica eventos `agent:*` com `audited: true`
- Mantém `AgentSessionMetricsStore` (métricas de sessão)

### AgentCapabilityMatcher

Regras:

- Agente só recebe missão com capabilities compatíveis
- Agente `unavailable` ou `running` → rejeição (`rejected_busy`)
- Missão sem agente → `rejected_incompatible`
- Nenhuma atribuição por nome textual informal

Decisões: `AgentAssignmentDecision` — assigned | rejected_incompatible | rejected_busy | rejected_unavailable

### AgentExecutionSafetyPolicy

Bloqueia capabilities perigosas: deploy, shell, secrets, migration, service_role, network não autorizada.

### OperationalSnapshotSource

Interface única para coleta de snapshots da plataforma. Implementação HQ: `buildOperationalSnapshotFromPlatform` + hooks.

## Assignment

```typescript
const assignment = agentRuntime.resolveAssignment({
  missionType: "operational_diagnostic",
  requiredCapabilities: ["platform:diagnostics"],
  preferredAgentId: "system-diagnostics-agent",
});
```

Falha controlada quando `decision !== "assigned"`.

## Event Bus

Categoria `agents`:

- `agent:registered`
- `agent:assigned`
- `agent:execution_started`
- `agent:progress`
- `agent:execution_completed`
- `agent:execution_failed`
- `agent:execution_cancelled`
- `agent:assignment_rejected`

Todos com `audited: true` — mapper de audit ignora re-auditoria (anti-loop).

## Integração Headquarters

- `OperationalAgentContext` — provider de runtime + snapshot source
- `MissionExecutionIntegration` — wiring coordinator + runtime
- `MissionExecutionWidget` — UI unificada (agente, read-only, riscos, recomendações)
- `AgentsPageContent` — lista agente com métricas reais de sessão

## Métricas

`AgentSessionMetrics` por agentId — executions, outcomes, duração média. Sem dados sensíveis.

## Agentes operacionais (Sprint 5.52)

| Agente | Missão | Relatório |
|--------|--------|-----------|
| System Diagnostics Agent | `operational_diagnostic` | `AgentExecutionReport` |
| Release Readiness Agent | `release_readiness_review` | `ReleaseReadinessAgentReport` |

Diagnosticar ≠ recomendar ≠ aprovar: apenas o **owner** humano possui `release:approve_production` no RBAC.

Ver: [Multi-Agent Assignment](./multi-agent-assignment.md), [Release Readiness Agent](../agents/release-readiness-agent.md).

## Próximos agentes

1. Novo manifest + validação de segurança
2. Implementação read-only ou policy explícita para mutações
3. Registro no runtime
4. Executor de missão + capability mapping
5. Extensão do widget existente (preferido sobre widgets duplicados)

Ver: [System Diagnostics Agent](../agents/system-diagnostics-agent.md), [Agent Execution Runbook](../operations/agent-execution-runbook.md).
