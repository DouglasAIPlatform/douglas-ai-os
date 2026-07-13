# Mission Persistence — Acceptance Scenarios

Cenários executados pelo `MissionPersistenceRuntimeValidator` no staging.

| ID | Cenário | Esperado |
|----|---------|----------|
| health_probe | Probe de tabelas | `mission_executions` acessível |
| persist_operational_diagnostic | Gravar diagnostic | Insert OK para role autorizada |
| persist_release_readiness_review | Gravar release review | Insert OK |
| timeline_and_completion | Eventos + completed | Sequence única, progress 100 |
| reload_read | Re-leitura | Mesmo `execution_id` após reload lógico |
| duplicate_execution | Segundo save mesmo id | Erro duplicate |
| duplicate_event | Mesma sequence | Erro duplicate |
| reject_unknown_mission_type | Tipo inválido | Rejeitado por RLS/policy |

## Test data policy

- Prefixo: `acceptance:`
- Flag metadata: `persistence_acceptance_test`
- Mission types: apenas catálogo canônico (`operational_diagnostic`, `release_readiness_review`)
- `createdByUserId` derivado de `auth.uid()` — nunca role do browser
- Sem auto-delete

## Checks remotos (report)

Status por check: `unknown` → `pending` → `passed` | `warning` | `failed` | `blocked`

Checks mínimos documentados em Sprint 5.54 — ver `MissionPersistenceRemoteCheck.ts`.

## Pós-migration manual

1. Aplicar `20250710210000_mission_executions.sql` no staging.
2. Configurar env staging.
3. Login owner/operator com profile active.
4. Executar validação segura no widget.
5. Revisar report: status `passed` e evento `mission:persistence_remote_confirmed`.
