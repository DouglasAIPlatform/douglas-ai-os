# Audit Edge Function — Douglas AI Platform

> Status: Production hardening v1.3  
> Sprints: 5.24 (foundation) + 5.27 (hardening) + 5.33 (production) + **5.35 (role authorization)**  
> Escopo: função `audit-ingest` — deploy manual; **service_role somente no runtime Deno**.

## Problema

A tabela `operational_audit_entries` (migration 5.20) nega INSERT para `anon`/`authenticated`. O browser não pode append audit via PostgREST com anon key.

```
Browser (anon key + JWT opcional)
  └── functions.invoke('audit-ingest', { body: AuditEntry })
        └── Deno runtime
              └── service_role (server-only, auto-injetada)
                    └── INSERT operational_audit_entries  ✅
```

## Resposta padronizada

```json
{
  "success": true,
  "status": "accepted",
  "message": "Audit entry accepted",
  "auditId": "…",
  "requestId": "…",
  "correlationId": "…",
  "errorCode": "invalid_payload"
}
```

| Campo | Descrição |
|-------|-----------|
| `success` | Resultado booleano |
| `status` | `accepted` \| `rejected` \| `error` |
| `message` | Mensagem sanitizada (sem secrets) |
| `auditId` / `requestId` / `correlationId` | Preservados em sucesso **e** rejeição de payload |
| `errorCode` | Código estável snake_case (Sprint 5.33) |

### Códigos de erro (Sprint 5.33 + 5.35)

| `errorCode` | HTTP | Significado |
|-------------|------|-------------|
| `method_not_allowed` | 405 | Apenas POST (+ OPTIONS preflight) |
| `cors_rejected` | 403 | Origin fora da allowlist |
| `missing_auth` | 401 | JWT obrigatório ausente |
| `invalid_token` | 401 | JWT inválido ou expirado |
| `profile_not_found` | 403 | Sem `operator_profiles` para a sessão |
| `profile_inactive` | 403 | Profile com status ≠ `active` |
| `role_not_allowed` | 403 | Role bloqueada (ex.: `viewer`) |
| `actor_resolution_failed` | 500 | Falha interna na resolução de ator |
| `invalid_payload` | 400 | JSON/payload/campos/metadata inválidos |
| `insert_failed` | 500 | Falha Postgres (detail não exposto ao client) |
| `internal_error` | 500 | Configuração server-side incompleta |

Códigos legados Sprint 5.27 (`METHOD_NOT_ALLOWED`, `VALIDATION_FAILED`, etc.) são **normalizados** no client via `normalizeAuditIngestErrorCode()`.

Códigos client-side adicionais: `function_error`, `function_not_deployed`.

## Validação de payload (Sprint 5.33)

### Obrigatórios (não vazios)

`id`, `timestamp`, `actor`, `role`, `source`, `action`, `severity`, `message`

`target` — string (pode ser vazia).

### Metadata

| Regra | Limite |
|-------|--------|
| Deve ser objeto | — |
| Tamanho serializado | ≤ 8192 bytes (default) |
| `correlationId`, `requestId`, `auditId` (+ snake_case) | String não vazia quando presente |

Override opcional: `AUDIT_INGEST_MAX_METADATA_BYTES` (secret Edge).

Alinhado com `validateAuditEntryForIngest()` em `@douglas/audit`.

## Variáveis de ambiente

### Frontend / Next.js — **nunca**

| Variável | Permitido |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | **Nunca** |
| `AUDIT_INGEST_*` | **Nunca** |

### Edge Function runtime (Supabase platform)

| Variável | Obrigatória | Default | Descrição |
|----------|-------------|---------|-----------|
| `SUPABASE_URL` | Sim (auto) | — | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (auto) | — | INSERT bypass RLS — **somente Deno** |
| `SUPABASE_ANON_KEY` | Sim se JWT ativo (auto) | — | Valida token via `auth.getUser()` |
| `AUDIT_INGEST_CORS_ORIGIN` | Não | `*` | Allowlist CORS — origin único ou lista separada por vírgula |
| `AUDIT_INGEST_AUTH_MODE` | Não | `optional` | `disabled` \| `optional` \| `required` — ver [audit-edge-role-authorization.md](./audit-edge-role-authorization.md) |
| `AUDIT_INGEST_REQUIRE_JWT` | Não | `false` | **Legado 5.33** — `"true"` equivale a `AUTH_MODE=required` |
| `AUDIT_INGEST_MAX_METADATA_BYTES` | Não | `8192` | Limite de metadata serializado |

**Nenhuma env nova é exigida para dev local** — default `optional` + CORS `*` permitem desenvolvimento sem login.

## CORS restrito (staging/prod)

```bash
# Origin único
supabase secrets set AUDIT_INGEST_CORS_ORIGIN=https://headquarters.example.com

# Múltiplos origins
supabase secrets set AUDIT_INGEST_CORS_ORIGIN=https://staging.example.com,http://localhost:3000
```

- `*` (default): aceita qualquer origin (dev)
- Lista explícita: rejeita com `cors_rejected` (403)
- Invoke sem header `Origin` (Supabase client): permitido — não é browser cross-origin

## Autenticação e autorização (Sprint 5.35)

Modo recomendado staging/produção:

```bash
supabase secrets set AUDIT_INGEST_AUTH_MODE=required
supabase functions deploy audit-ingest
```

Fluxo quando autenticado:

1. `Authorization: Bearer <token>` → `auth.getUser()`
2. Lookup `operator_profiles` por `user_id`
3. Exige `status = active` e role ∈ `{ owner, admin, operator }`
4. Sobrescreve `actor_id`, `actor_name`, `actor_role` server-side

Documentação completa: [audit-edge-role-authorization.md](./audit-edge-role-authorization.md)

### Legado JWT (5.33)

`AUDIT_INGEST_REQUIRE_JWT=true` ainda funciona — mapeia para `required`.

### Limites fora do escopo

- Escopo granular para `viewer`
- Rate limiting
- Idempotência de `audit_id`

## Modos do adapter

| Modo | HQ atual | Comportamento |
|------|----------|---------------|
| `direct_client` | Disponível | RLS bloqueia → fallback local |
| `edge_function` | **Ativo em staging** | Invoke audit-ingest |

Falha remota → localStorage + pending queue (Sprints 5.30/5.32).

## Testar em staging

1. Migrations aplicadas (`operational_audit_entries`)
2. `supabase functions deploy audit-ingest`
3. Secrets:
   ```bash
   supabase secrets set AUDIT_INGEST_CORS_ORIGIN=http://localhost:3000
   # staging/produção:
   # supabase secrets set AUDIT_INGEST_AUTH_MODE=required
   ```
4. HQ: `writeMode: "edge_function"` em `features/platform-audit/config.ts`
5. Login Supabase → gerar evento audit → `AuditTrailWidget`:
   - Último status remoto: `accepted`
   - Fallback local: inativo (se sync OK)
6. Teste negativo CORS: origin não listado → `cors_rejected`
7. Teste auth (modo required): logout → `missing_auth`; viewer → `role_not_allowed`

### curl (smoke test)

```bash
curl -X POST "$SUPABASE_URL/functions/v1/audit-ingest" \
  -H "Authorization: Bearer $ANON_OR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"id":"test-1","timestamp":"2026-07-09T00:00:00.000Z","actor":"ops","role":"admin","source":"platform","action":"readiness_status_changed","target":"staging","severity":"info","message":"smoke test","metadata":{}}'
```

## Referências

- [audit-edge-role-authorization.md](./audit-edge-role-authorization.md)
- [audit-migration-supabase.md](./audit-migration-supabase.md)
- [audit-pending-queue-retry.md](./audit-pending-queue-retry.md)
- [supabase-schema-rls.md](./supabase-schema-rls.md)
