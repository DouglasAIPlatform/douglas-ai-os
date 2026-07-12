# Mission Persistence Runbook

## Aplicar migration (manual)

1. Revisar `supabase/migrations/20250710210000_mission_executions.sql`
2. Aplicar conforme [apply-supabase-migrations](./apply-supabase-migrations.md)
3. Validar RLS com operador viewer (somente leitura) e operator (escrita dos types persistíveis)
4. Confirmar `is_operational_mission_type` inclui todos os entries de `PERSISTABLE_MISSION_TYPES`
5. **Não** usar `service_role` no frontend Headquarters

## Verificação pós-migration

```bash
pnpm test
pnpm validate
pnpm staging:check
pnpm release:check
```

Checks bloqueantes incluem migration presente, RLS, adapter, fallback, recovery policy, **mission type catalog aligned** e testes.

## Ambientes

| Ambiente | Modo esperado | Notas |
|----------|---------------|-------|
| Development | `supabase_preferred` | Fallback session OK |
| Staging | `supabase_required` | Após bootstrap Supabase |
| Production | `supabase_required` | Sem perda silenciosa |

Config HQ: `apps/headquarters/features/mission-control/missionExecutionPersistenceConfig.ts`

## Fallback ativo

Quando Supabase falha ou tabela ausente:

1. Widget exibe aviso "Fallback sessionStorage ativo"
2. Execuções continuam em sessionStorage
3. Fila pendente (máx. 50) acumula writes
4. Operador pode usar **Retry sync** quando Supabase voltar

## Reidratação

No load do Headquarters:

1. `initialize()` probe tabelas
2. `rehydrateMissionExecutions()` — últimas 10 execuções
3. Timeline da execução mais recente
4. Running/assigned → `interrupted` (default) ou `recovery_required`
5. **Agente não reinicia** automaticamente

## recovery_required

Emitido via `mission:recovery_required` quando policy configurada para `recovery_required`.

Operador deve iniciar nova execução manualmente (retry cria nova tentativa com `attempt` incrementado).

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| Persistência sempre session | Verificar Supabase config + migration aplicada |
| `createdByUserId ausente` | Auth real necessário (não mock) |
| Sync pendente crescente | Retry sync; verificar RLS do operator |
| Resultado terminal não atualiza | Esperado — idempotência DB |

## Referências

- [Architecture](../architecture/mission-persistence.md)
- [Schema](../database/mission-execution-schema.md)
