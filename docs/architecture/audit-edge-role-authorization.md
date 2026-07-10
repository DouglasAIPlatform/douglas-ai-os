# Audit Edge Role Authorization — Douglas AI Platform

> Status: Architecture v1.0  
> Sprint: 5.35  
> Escopo: autenticação + autorização server-side na Edge Function `audit-ingest`.

## Problema

Até a Sprint 5.33, a função validava **presença** de JWT (`AUDIT_INGEST_REQUIRE_JWT`), mas:

- Não consultava `operator_profiles`
- Confiava em `actor` / `role` enviados pelo browser
- Não aplicava política de roles

Isso permitia que um cliente autenticado registrasse audit com identidade arbitrária.

## Solução (Sprint 5.35)

```
Browser (anon key + JWT de sessão)
  └── functions.invoke('audit-ingest', { body })
        └── Deno: authorizeAuditIngest()
              ├── auth.getUser(token)
              ├── SELECT operator_profiles WHERE user_id = auth.uid
              ├── AuditAuthorizationPolicy (role + status)
              ├── AuditActorResolution (server-side)
              └── service_role INSERT com actor_id/name/role derivados do profile
```

O browser pode enviar contexto (`message`, `metadata`, `correlationId`), mas **não define sua própria role** quando autenticado.

## Autenticação vs autorização

| Camada | O que faz | Falha |
|--------|-----------|-------|
| **Autenticação** | Valida JWT via Supabase Auth | `missing_auth`, `invalid_token` |
| **Autorização** | Profile em `operator_profiles`, status `active`, role permitida | `profile_not_found`, `profile_inactive`, `role_not_allowed` |
| **Resolução de ator** | Deriva `actor_id`, `actor_name`, `actor_role` do profile | `actor_resolution_failed` |

## operator_profiles

Lookup read-only via **service_role** (server-side only):

```sql
SELECT id, user_id, display_name, role, status
FROM operator_profiles
WHERE user_id = <auth.uid>
LIMIT 1;
```

Campos usados na resolução:

| Campo DB | Campo audit row |
|----------|-----------------|
| `id` | `actor_id` |
| `display_name` | `actor_name` |
| `role` | `actor_role` |

Metadata enriquecida: `operatorId`, `operatorRoleSource: "server_profile"`.

## Roles permitidas

| Role | Ingest remoto |
|------|---------------|
| `owner` | ✅ |
| `admin` | ✅ |
| `operator` | ✅ |
| `viewer` | ❌ bloqueado |

### Por que `viewer` está bloqueado

A Sprint 5.35 exigiria distinguir ações próprias não-administrativas com segurança. Isso dependeria de regras acopladas ao payload do browser — vetor de escalada de privilégio. **Viewer é bloqueado até sprint futura** com modelo de escopo explícito.

## AUDIT_INGEST_AUTH_MODE

Substitui/evolui `AUDIT_INGEST_REQUIRE_JWT`.

| Modo | Comportamento |
|------|---------------|
| `disabled` | Sem auth — actor do payload (legado dev) |
| `optional` | **Default** — sem JWT usa payload; com JWT aplica auth + profile + policy |
| `required` | JWT + profile + policy obrigatórios |

### Resolução de modo

1. `AUDIT_INGEST_AUTH_MODE` explícito
2. Senão, `AUDIT_INGEST_REQUIRE_JWT=true` → `required` (compat 5.33)
3. Senão → `optional` (dev local sem quebrar)

### Recomendação por ambiente

| Ambiente | Modo | Secrets |
|----------|------|---------|
| Dev local | `optional` (default) | nenhum extra |
| Staging | `required` | `AUDIT_INGEST_AUTH_MODE=required` |
| Produção | `required` | + CORS restrito |

```bash
supabase secrets set AUDIT_INGEST_AUTH_MODE=required
supabase secrets set AUDIT_INGEST_CORS_ORIGIN=https://hq.example.com
supabase functions deploy audit-ingest
```

**Nenhuma env nova é obrigatória para dev local** — default `optional` preserva fluxo sem Supabase login.

## errorCode (Sprint 5.35)

| Código | HTTP | Significado |
|--------|------|-------------|
| `invalid_token` | 401 | JWT inválido/expirado |
| `profile_not_found` | 403 | Sem row em `operator_profiles` |
| `profile_inactive` | 403 | Status ≠ `active` |
| `role_not_allowed` | 403 | Role bloqueada (ex.: `viewer`) |
| `actor_resolution_failed` | 500 | Falha interna na resolução |

Preservados de 5.33: `missing_auth`, `invalid_payload`, `insert_failed`, etc.

`requestId`, `correlationId`, `auditId` preservados em respostas de rejeição.

## Por que o browser não define role

1. **Integridade do audit trail** — entradas devem refletir identidade real do operador
2. **RBAC** — `operator_profiles` é fonte de verdade pós-handoff (Sprint 5.29+)
3. **Anti-spoofing** — payload `role: "owner"` não eleva privilégios no INSERT remoto
4. **RLS complementar** — ingest server-side alinha com políticas Postgres

## Fallback localStorage

Quando ingest remoto falha (`profile_not_found`, `role_not_allowed`, etc.):

- `CompositeAuditPersistenceAdapter` grava localmente
- Pending queue + retry manual (Sprints 5.30/5.32)
- **Contrato público inalterado**

## Módulos Deno (função)

| Arquivo | Responsabilidade |
|---------|------------------|
| `AuditAuthMode.ts` | `disabled` / `optional` / `required` |
| `AuthorizedOperator.ts` | Tipo + parse de row |
| `AuditAuthorizationPolicy.ts` | Roles + status |
| `AuditActorResolution.ts` | Identidade server-side |
| `AuditAuthorizationResult.ts` | Success/failure tipado |
| `authorizeAuditIngest.ts` | Orquestração |

## Client (`@douglas/audit`)

- `normalizeAuditIngestErrorCode()` reconhece novos códigos
- `AUDIT_INGEST_ERROR_CODE_LABELS` atualizado para UI (`AuditTrailWidget`)
- `SupabaseAuditEdgeInvoke` — sem mudança de contrato; parse existente

## Referências

- [audit-edge-function.md](./audit-edge-function.md)
- [auth-operator-handoff.md](./auth-operator-handoff.md)
- [audit-migration-supabase.md](./audit-migration-supabase.md)
