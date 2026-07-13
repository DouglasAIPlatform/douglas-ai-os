# Staging Persistence Acceptance

Operação para validar **reidratação**, **recovery** e **histórico multiagente** após apply manual da migration `20250710210000_mission_executions.sql` no projeto staging.

## Pré-requisitos

- `NEXT_PUBLIC_DOS_ENVIRONMENT=staging`
- Modo `supabase_required` (sem fallback sessionStorage)
- Migration mission_executions aplicada manualmente
- Login real + `operator_profile` ativo
- Role `operator`, `admin` ou `owner`

## Execução

1. Abra **Headquarters → Mission Control**
2. Seção **Staging Persistence Acceptance**
3. Confirme ambiente, adapter Supabase e elegibilidade
4. **Iniciar acceptance** (confirmação explícita)
5. Se checkpoint de reload aparecer:
   - Recarregue a página
   - **Retomar após reload**

## Cenários

| ID | Objetivo |
|----|----------|
| `system_diagnostics` | operational_diagnostic persistido, reidratado, agente não reexecutado |
| `release_readiness` | release_readiness_review + verdict, sem aprovação de produção |
| `recovery` | running → interrupted/recovery_required, sem auto-continue |
| `fallback_detection` | fallback em staging bloqueia acceptance |
| `multi_agent_isolation` | métricas/histórico isolados por agentId |

## Interpretação

| Status | Significado |
|--------|-------------|
| `not_run` | Acceptance ainda não executada |
| `running` | Em andamento ou aguardando retomada |
| `passed` | Todos os cenários ok |
| `passed_with_warnings` | Ok com alertas (ex.: métricas parciais) |
| `failed` | Falha em cenário crítico |
| `blocked` | Fallback, RBAC ou elegibilidade impediu execução |

## Checks estáticos

```bash
pnpm staging:acceptance:check
```

Esperado antes do staging real: **`passed_with_runtime_checks_pending`**

## Production Safety Gate

Após acceptance bem-sucedida em staging, os checks abaixo passam de **pendente** para **pass**:

- Persistência remota validada
- Reidratação validada
- Recovery interrupted validado
- Histórico diagnostics/release validado
- Isolamento multi-agent validado
- Fallback inativo em staging

## Registros de teste

- Prefixo `acceptance:` em executionIds
- Flag `persistence_acceptance_test` em metadata
- **Não** apagados automaticamente — limpeza manual futura se necessário

## Referências

- [persistence-rehydration-lifecycle.md](../architecture/persistence-rehydration-lifecycle.md)
- [mission-recovery-runbook.md](./mission-recovery-runbook.md)
- [remote-mission-persistence-validation.md](./remote-mission-persistence-validation.md)
