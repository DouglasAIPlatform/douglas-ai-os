# Remote Mission Persistence Validation

Sprint 5.54 — validação remota de persistência de missões após aplicação manual da migration `20250710210000_mission_executions.sql`.

## Objetivo

Provar no ambiente **staging** (browser autenticado) que:

- execuções são gravadas no Supabase;
- timeline (`mission_execution_events`) é persistida;
- RLS responde conforme role;
- fallback `sessionStorage` está inativo;
- dados sobrevivem a reload;
- `operational_diagnostic` e `release_readiness_review` são persistidos;
- duplicatas de `executionId` e eventos são rejeitadas.

## Pré-requisitos

1. Migration aplicada manualmente no projeto staging (ver runbook).
2. `NEXT_PUBLIC_DOS_ENVIRONMENT=staging` e Supabase configurado.
3. Login real com `operator_profile` **active**.
4. Role `operator`, `admin` ou `owner` (viewer bloqueado).

## Como executar

1. Abra Headquarters → widget **Mission Execution**.
2. Seção **Validação de persistência remota**.
3. Clique **Executar validação segura** → **Confirmar validação**.

O validator **não executa no mount** — somente após confirmação explícita.

## Segurança

- Usa client Supabase **público** + sessão real.
- **Nunca** usa `service_role`.
- Não imprime URL, anon key ou UID.
- Registros acceptance usam prefixo `acceptance:` e flag `persistence_acceptance_test`.
- **Não apaga** dados remotos nesta fase.

## Eventos emitidos

- `mission:persistence_validation_started`
- `mission:persistence_validation_passed` | `mission:persistence_validation_failed`
- `mission:persistence_remote_confirmed` (quando todos os checks passam)

Auditoria: início, sucesso e falha (via audit log explícito, sem loop).

## Development

Em development o botão permanece **desabilitado** — fallback `sessionStorage` continua permitido (`supabase_preferred`).

## Referências

- [Cenários de acceptance](./mission-persistence-acceptance-scenarios.md)
- [Runbook mission persistence](./mission-persistence-runbook.md)
- [Schema](../database/mission-execution-schema.md)
