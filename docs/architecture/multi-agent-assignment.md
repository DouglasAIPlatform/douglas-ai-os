# Multi-Agent Assignment

Sprint 5.52 — atribuição de missões a múltiplos agentes operacionais.

## Agentes registrados

| Agente | Missão | Capabilities principais |
|--------|--------|-------------------------|
| `system-diagnostics-agent` | `operational_diagnostic` | `platform:diagnostics` |
| `release-readiness-agent` | `release_readiness_review` | `release:inspect` |

Ambos registrados por padrão em `OperationalAgentRegistry`.

## Capability matching

`AgentCapabilityMatcher` atribui agentes por:

1. `supportedMissionTypes` contém o `missionType`
2. Todas `requiredCapabilities` ⊆ `agent.capabilities`
3. `preferredAgentId` quando fornecido
4. Agente disponível (não `running`/`assigned`/`unavailable`)

Decisões: `assigned`, `rejected_incompatible`, `rejected_unavailable`, `rejected_busy`.

## Mapeamento missão → agente

| Mission type | Agente | Executor |
|--------------|--------|----------|
| `operational_diagnostic` | `system-diagnostics-agent` | `DiagnosticMissionExecutor` |
| `release_readiness_review` | `release-readiness-agent` | `ReleaseReadinessMissionExecutor` |

Atribuição **nunca** ocorre apenas pelo nome — sempre via matching de capabilities e mission type.

## Fluxo

```
MissionExecutionCoordinator
  → MissionExecutorRegistry.get(missionType)
  → executor.buildPlan() → resolveAssignment()
  → executor.execute() → OperationalAgentRuntime.execute()
  → agente específico → relatório → persistence
```

## Snapshot sources

| Agente | Source |
|--------|--------|
| Diagnostics | `OperationalSnapshotSource` |
| Release Readiness | `ReleaseReadinessSnapshotSource` |

HQ compõe sources via hooks (`useOperationalSnapshotSource`, `useReleaseReadinessSnapshotSource`).

## Seleção na UI

`MissionExecutionWidget` permite escolher missão sem duplicar widgets. `useMissionExecution` expõe `missionKind` e `setMissionKind`.

## Segurança

- Nenhum agente possui `release:approve_production`
- Ambos são read-only
- Eventos `agent:*` com `audited: true`

## Referências

- [Operational Agent Runtime](./operational-agent-runtime.md)
- [Release Readiness Agent](../agents/release-readiness-agent.md)
