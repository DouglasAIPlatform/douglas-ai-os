# Audit Edge Function — Douglas AI Platform

> Status: Hardening v1.1  
> Sprint: 5.24 (foundation) + 5.27 (hardening)  
> Escopo: função `audit-ingest` preparada — **sem deploy nesta sprint**.

## Problema

A tabela `operational_audit_entries` (migration 5.20) tem RLS que **nega INSERT** para roles `anon` e `authenticated`. O browser com anon key não pode append audit de forma segura.

```
Browser (anon key)
  └── INSERT operational_audit_entries  ❌ RLS policy WITH CHECK (false)
  └── localStorage fallback             ✅ Sprint 5.22
```

## Solução — Edge Function `audit-ingest`

```
Browser (anon key + JWT futuro)
  └── functions.invoke('audit-ingest', { body: AuditEntry })
        └── Deno runtime
              └── service_role (server-only)
                    └── INSERT operational_audit_entries  ✅
```

A `service_role` existe **apenas** no ambiente da Edge Function (injetada pelo Supabase). **Nunca** no bundle Next.js, widgets ou `.env.local` do app.

## Arquivos

| Path | Função |
|------|--------|
| `supabase/functions/audit-ingest/index.ts` | Handler Deno — validate + insert + resposta padronizada |
| `supabase/functions/audit-ingest/README.md` | Contrato e deploy |
| `packages/audit/src/AuditIngestPayload.ts` | Validação client-side |
| `packages/audit/src/AuditIngestResponse.ts` | Contrato de resposta + parser + sanitização UI |
| `packages/audit/src/SupabaseAuditEdgeInvoke.ts` | `client.functions.invoke()` |
| `packages/audit/src/SupabaseAuditWriteMode.ts` | `direct_client` \| `edge_function` |

## Resposta padronizada (Sprint 5.27)

Todas as respostas JSON seguem:

```json
{
  "success": true,
  "status": "accepted",
  "message": "Audit entry accepted",
  "auditId": "…",
  "requestId": "…",
  "correlationId": "…",
  "errorCode": "VALIDATION_FAILED"
}
```

| Campo | Descrição |
|-------|-----------|
| `success` | Resultado booleano |
| `status` | `accepted` \| `rejected` \| `error` |
| `message` | Mensagem humana (sem secrets) |
| `auditId` | ID da entrada aceita ou rejeitada |
| `requestId` | De `metadata.requestId` quando presente |
| `correlationId` | De `metadata.correlationId` quando presente |
| `errorCode` | Código estável para UI/ops |

### Códigos de erro

| `errorCode` | HTTP | Significado |
|-------------|------|-------------|
| `METHOD_NOT_ALLOWED` | 405 | Apenas POST |
| `INVALID_JSON` | 400 | Body malformado |
| `VALIDATION_FAILED` | 400 | Campos obrigatórios/opcionais inválidos |
| `JWT_REQUIRED` | 401 | Modo JWT ativo sem Bearer |
| `JWT_INVALID` | 401 | Token inválido/expirado |
| `CONFIG_ERROR` | 500 | Env vars server-side ausentes |
| `INSERT_FAILED` | 500 | Falha Postgres (sem expor detail sensível) |

O client (`parseAuditIngestResponse`) aceita também respostas legacy `{ ok: true }` da foundation 5.24.

## Validação de payload

### Obrigatórios

`id`, `timestamp`, `actor`, `role`, `source`, `action`, `target`, `severity`, `message`

### Opcionais (validados quando presentes)

| Campo | Regra |
|-------|-------|
| `metadata` | Deve ser objeto |
| `metadata.correlationId` / `correlation_id` | String não vazia |
| `metadata.requestId` / `request_id` | String não vazia |
| `metadata.auditId` / `audit_id` | String não vazia |

Alinhado com `validateAuditEntryForIngest()` no pacote `@douglas/audit`.

## Modos do adapter (`SupabaseAuditWriteMode`)

| Modo | Padrão | Comportamento |
|------|--------|---------------|
| `direct_client` | **Sim** | INSERT via PostgREST — bloqueado por RLS; fallback local |
| `edge_function` | Não | Invoke `audit-ingest` — recomendado após deploy |

Headquarters mantém default `direct_client` até deploy validado em staging.

## Variáveis de ambiente

### Frontend / Next.js (`.env.local`)

| Variável | Permitido |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | **Nunca** |

### Edge Function runtime (Supabase platform — server-side)

| Variável | Fonte | Descrição |
|----------|-------|-----------|
| `SUPABASE_URL` | Auto-injetada | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injetada | Insert com bypass RLS — **nunca logar** |
| `SUPABASE_ANON_KEY` | Auto-injetada | Validação JWT quando modo JWT ativo |
| `AUDIT_INGEST_CORS_ORIGIN` | Secret manual | Origin permitido (default `*` dev) |
| `AUDIT_INGEST_REQUIRE_JWT` | Secret manual | `"true"` exige Bearer JWT válido |

**Por que service_role nunca vai para o frontend:** a anon key + JWT identificam o usuário; a Edge Function usa service_role **somente no Deno** para INSERT autorizado. Expor service_role no browser bypassaria RLS inteiro.

### CORS em produção

```bash
# Supabase Dashboard → Edge Functions → Secrets
AUDIT_INGEST_CORS_ORIGIN=https://headquarters.seudominio.com
```

Default `*` é aceitável em dev/staging inicial; restringir antes de produção.

### JWT futuro (staging/prod)

```bash
AUDIT_INGEST_REQUIRE_JWT=true
supabase functions deploy audit-ingest   # com verify_jwt habilitado no config
```

Com JWT ativo, invoke usa sessão Supabase Auth do browser (`Authorization: Bearer …` automático via client).

## Fluxo de append (edge_function — futuro)

1. `AuditProvider` grava evento → `CompositeAuditPersistenceAdapter`
2. localStorage append (sempre)
3. `SupabaseAuditPersistenceAdapter.appendAsync()`
4. `validateAuditEntryForIngest(entry)`
5. `invokeAuditIngestEdgeFunction({ client, functionName, payload })`
6. Edge Function valida + JWT (se ativo) + `insert` com service_role
7. Resposta padronizada → `lastRemoteStatus` no widget
8. Falha → `fallbackUsed: true`, localStorage permanece source of truth

## UI — AuditTrailWidget

Quando `writeMode: "edge_function"`:

- Modo Edge Function
- Último status remoto (`accepted` / `rejected` / `error`)
- Fallback local ativo/inativo
- Flag função não deployada
- Erros sanitizados (`sanitizeAuditErrorForDisplay`) — sem JWT/keys

## Riscos

| Risco | Mitigação atual | Próximo passo |
|-------|-----------------|---------------|
| service_role leak | Não está no repo/client | CI secret scan |
| Invoke sem auth | JWT opcional via env | `AUDIT_INGEST_REQUIRE_JWT=true` em prod |
| Payload spoofing | Validação + JWT futuro | Cruzar actor com `auth.uid()` |
| Duplicate audit_id | Nenhuma | Unique index + idempotency |
| CORS `*` | Configurável via env | Domínio prod restrito |
| Função não deployada | `direct_client` default + local fallback | Deploy staging |

## Deploy futuro (checklist)

1. Aplicar migrations 5.20 (checklist ops 5.23)
2. `supabase secrets set AUDIT_INGEST_CORS_ORIGIN=…`
3. `supabase functions deploy audit-ingest`
4. Testar invoke manual (curl / Dashboard)
5. Validar INSERT no SQL Editor
6. `auditSupabaseConfig.writeMode = "edge_function"` em staging
7. Validar `AuditTrailWidget` — status remoto `accepted`
8. Ativar `AUDIT_INGEST_REQUIRE_JWT=true` antes de produção

## Referências

- [audit-migration-supabase.md](./audit-migration-supabase.md)
- [supabase-schema-rls.md](./supabase-schema-rls.md)
- [../operations/apply-supabase-migrations.md](../operations/apply-supabase-migrations.md)
