# Release Readiness Agent

Sprint 5.52 — segundo agente operacional read-only da Douglas AI OS.

## Identidade

| Campo | Valor |
|-------|-------|
| ID | `release-readiness-agent` |
| Nome | Release Readiness Agent |
| Departamento | Governance |
| Versão | 1.0.0 |
| Read-only | Sim |

## Missão suportada

`release_readiness_review` — revisão determinística de readiness com base em snapshots internos.

## Capabilities permitidas

- `release:inspect`
- `staging:inspect`
- `environment:inspect`
- `safety:inspect`
- `audit:summary`
- `mission:persistence_inspect`
- `agent:metrics_inspect`

## Ações bloqueadas

O agente **não possui** e a política bloqueia:

- `release:approve_production`
- `deploy`, `migration`, `tag:create`
- `git:commit`, `git:push`
- `shell:execute`, `secret:access`
- `role:escalate`, `config:critical`
- `service_role:access`, `network:unrestricted`

## Fonte de snapshots

Contratos públicos mapeados para refs sanitizados:

| Contrato | Uso |
|----------|-----|
| `ReleaseStatusSnapshot` | Versão, channel, readiness estático |
| `StagingReadinessReport` | Status staging, blockers |
| `ProductionSafetyReport` | Gate de produção |
| `EnvironmentResolution` | Ambiente canônico |
| `AuditIngestObservabilitySnapshot` | Saúde do audit ingest |
| `MissionExecutionPersistenceHealth` | Persistência de missões |
| `AgentExecutionMetricsSnapshot` | Métricas dos agentes |

O agente **não** consulta GitHub Actions nem status de CI remoto indisponível no runtime browser.

## Verdicts

| Verdict | Significado |
|---------|-------------|
| `ready_for_staging` | Pronto para validação em staging |
| `ready_for_production_review` | Elegível para revisão humana de produção |
| `blocked` | Bloqueios críticos detectados |
| `insufficient_data` | Snapshots essenciais ausentes |

## Relatório

`ReleaseReadinessAgentReport` inclui: versão, environment, channel, blockers, warnings, evidências, recomendações, persistência, audit, métricas de agentes, timestamp, executionId, correlationId.

**O agente apenas recomenda.** Aprovação de produção permanece exclusiva de `owner` via `release:approve_production` no RBAC humano.

## Headquarters

- Widget **Execução de Missão**: seletor entre diagnóstico e revisão de readiness
- Página `/agents`: card completo com histórico e métricas

## Referências

- [Multi-Agent Assignment](../architecture/multi-agent-assignment.md)
- [Release Readiness Agent Runbook](../operations/release-readiness-agent-runbook.md)
- [System Diagnostics Agent](./system-diagnostics-agent.md)
