# Agent Execution Runbook

Sprint 5.49 — operação do primeiro agente determinístico (System Diagnostics Agent).

## Pré-requisitos

- Headquarters com `RuntimeIntegration` ativo (runtime, health, graph, monitor, audit)
- Operador com permissão de execução de missão (`canPerformMissionExecution`)
- Ambiente sem mocks em staging/production (`mocksAllowed: false`)

## Executar diagnóstico

1. Abra **Headquarters** → widget **Mission Execution**
2. Confirme badge **Agente read-only** e agente `System Diagnostics Agent`
3. Clique **Executar diagnóstico operacional**
4. Acompanhe progresso (7 passos: runtime → health → dependencies → events → audit → relatório)
5. Revise resultado: status geral, riscos, recomendações

Alternativa: página **Agents** → card do System Diagnostics Agent (métricas de sessão + estado read-only).

## Fluxo interno

```
Request → mission:created → validated → planned → assigned
  → agent:assigned → agent:execution_started → agent:progress
  → agent:execution_completed → mission:completed
```

Audit recebe entradas derivadas de `mission:*` e `agent:*` (payloads sanitizados).

## Interpretar relatório

| overallStatus | Significado |
|---------------|-------------|
| healthy | Módulos críticos ausentes; dependências OK |
| degraded | Alertas em health ou eventos |
| critical | Módulos críticos ou dependências quebradas |
| unknown | Snapshot incompleto |

Campos úteis: `identifiedRisks`, `recommendations`, `readiness`, `auditState`, `currentEnvironment`.

## Cancelamento

Operador pode cancelar missão em execução. Coordinator chama `agentRuntime.cancel(executionId)` → `AGENT_CANCELLED`.

## Falhas comuns

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Assignment rejected | Agente ocupado ou missão incompatível | Aguardar conclusão ou verificar mission type |
| AGENT_ASSIGNMENT_REJECTED | Capability mismatch | Verificar manifest e required capabilities |
| Snapshot vazio | Hooks HQ sem dados | Confirmar runtime/health carregados |
| Viewer não executa | RBAC viewer | Esperado — apenas operator/admin |

## Segurança

- Agente **não** executa shell, deploy, migrations ou acessa secrets
- Relatórios não expõem tokens, keys ou PII
- Eventos agent marcados `audited: true` — não re-disparam ingest em loop

## Métricas de sessão

Na página Agents ou widget:

- Taxa de sucesso = `completed / executions`
- `lastExecutionAt`, `averageDurationMs`, `lastOutcome`

Métricas resetam ao recarregar HQ (sessão em memória).

## Validação release

```bash
pnpm test
pnpm validate
pnpm staging:check
pnpm release:check
```

Checks específicos: System Diagnostics Agent registrado, capabilities seguras, integração Mission → Agent, testes operational agent.

## Escalonamento

Problemas persistentes de readiness ou dependências críticas: revisar Production Safety Gate e Health Engine antes de deploy manual (fora do escopo deste agente).

## Referências

- [System Diagnostics Agent](../agents/system-diagnostics-agent.md)
- [Operational Agent Runtime](../architecture/operational-agent-runtime.md)
- [Mission Execution Runbook](./mission-execution-runbook.md)
