# Mission Execution Runbook

Operação do fluxo end-to-end de missões no Headquarters (Sprint 5.48).

## Pré-requisitos

- Headquarters em execução (`pnpm dev` no app headquarters)
- Operador com role adequado (mock role ou auth profile)
- Nenhuma migration remota necessária para esta sprint

## Executar diagnóstico operacional

1. Abra **Headquarters** → widget **Execução de Missão**
2. Verifique role efetivo (operator, admin ou owner para executar)
3. Clique **Executar diagnóstico** → confirme na segunda clicada
4. Acompanhe status, etapa, progresso e timeline
5. Resultado aparece ao concluir (~ instantâneo)

## RBAC

| Role | Executar diagnóstico | Cancelar | Visualizar |
|------|---------------------|----------|------------|
| owner | ✓ | ✓ | ✓ |
| admin | ✓ | ✓ | ✓ |
| operator | ✓ (somente diagnóstico) | ✗ | ✓ |
| viewer | ✗ | ✗ | ✓ |

## Cancelamento

Disponível para owner/admin enquanto status é `assigned` ou `running`.

1. Clique **Cancelar** → **Confirmar cancelamento**
2. Missão vai para `blocked` no board
3. Evento `mission:cancelled` é emitido

## Retry após falha

1. Após falha (ex.: viewer tentou executar), botão **Tentar novamente** aparece se role permitir
2. Retry usa novo `executionId` com `isRetry: true`
3. Resultado anterior não é sobrescrito silenciosamente

## Duplicidade

- Reexecutar com mesmo `executionId` após conclusão retorna resultado anterior
- Nova execução enquanto missão está `running` gera `mission:duplicate_rejected`

## Verificação local

```bash
pnpm exec vitest run packages/missions/src/execution/mission-execution.test.ts
pnpm exec vitest run packages/missions/src/mission-status-transition.test.ts
pnpm test
pnpm validate
pnpm release:check
```

**Nota:** missões não são executadas automaticamente durante build ou testes globais.

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| Botão executar desabilitado | Verifique role (viewer não executa) |
| "Coordinator indisponível" | Confirme `MissionExecutionIntegration` no AppShell |
| Timeline vazia | Execute uma missão; timeline preenche após progresso |
| Entradas duplicadas `active → active` | Corrigido em 5.49.1 — no-op guard |
| Eventos sem audit duplicado | Esperado — `audited: true` bloqueia mapper; audit via `appendAudit` |
| Progresso sem audit | Esperado — `mission:progress` não gera audit explícito |

## Audit exactly-once

- Lifecycle de missão: audit via `appendAudit` no coordinator (HQ conecta ao `auditLog`)
- Lifecycle de agente: audit via wrapper em `MissionExecutionIntegration` ao publicar `agent:*`
- Event Bus: payloads com `audited: true` — mapper ignora (anti-loop)
- Verifique audit trail no widget Audit — uma entrada por marco (`mission_completed`, `agent_execution_completed`, etc.)

## Limitações (pré-Supabase)

- Persistência in-memory / session apenas
- Sem execução remota ou fila distribuída
- Sem conexão a serviços de IA externos
- Board sincronizado via `MissionManager` local

## Próximos passos (futuro)

- Migration Supabase para `mission_executions`
- Persistência via `MissionExecutionPersistenceAdapter` remoto
- Novos executores além do diagnóstico operacional
