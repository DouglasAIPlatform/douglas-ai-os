# audit-ingest — Edge Function

> Sprint 5.24 (foundation) + 5.27 (hardening). **Não deployada automaticamente** pelo monorepo.

## Objetivo

Inserir entradas do Operational Audit Log em `operational_audit_entries` usando `service_role` **somente no runtime Deno**, contornando a negação de INSERT via RLS para `anon`/`authenticated`.

## Contrato HTTP

| Item | Valor |
|------|-------|
| Método | `POST` (OPTIONS para CORS preflight) |
| Body | JSON `AuditEntry` |
| Sucesso | `{ success: true, status: "accepted", message, auditId, … }` |
| Rejeição | `{ success: false, status: "rejected", message, errorCode }` |
| Erro | `{ success: false, status: "error", message, errorCode }` |

Campos obrigatórios: `id`, `timestamp`, `actor`, `role`, `source`, `action`, `target`, `severity`, `message`.

Opcionais validados: `metadata` (objeto), `metadata.correlationId`, `metadata.requestId`, `metadata.auditId` (e aliases snake_case).

## Variáveis de ambiente (runtime Edge)

| Variável | Onde | Frontend? |
|----------|------|-----------|
| `SUPABASE_URL` | Auto-injetada | **Nunca** |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injetada | **Nunca** |
| `SUPABASE_ANON_KEY` | Auto-injetada | **Nunca** (usada só para validar JWT) |
| `AUDIT_INGEST_CORS_ORIGIN` | Secret | **Nunca** — default `*` |
| `AUDIT_INGEST_REQUIRE_JWT` | Secret | **Nunca** — `"true"` em staging/prod futuro |

## CORS

- Dev: default `Access-Control-Allow-Origin: *`
- Prod: definir `AUDIT_INGEST_CORS_ORIGIN=https://seu-dominio`

## JWT (modo futuro)

Com `AUDIT_INGEST_REQUIRE_JWT=true`, requests sem `Authorization: Bearer <jwt>` retornam `401 JWT_REQUIRED`.

## Alinhamento com monorepo

| Monorepo | Edge Function |
|----------|---------------|
| `AuditIngestPayload.ts` | `validatePayload()` |
| `AuditIngestResponse.ts` | `jsonResponse()` body |
| `SupabaseAuditRowMapper.ts` | `mapToRow()` |

## Deploy (manual)

```bash
supabase secrets set AUDIT_INGEST_CORS_ORIGIN=https://staging.example.com
# supabase secrets set AUDIT_INGEST_REQUIRE_JWT=true   # após auth estável
supabase functions deploy audit-ingest
```

Após deploy:

```typescript
// features/platform-audit/config.ts
writeMode: "edge_function",
```

## Referências

- `docs/architecture/audit-edge-function.md`
- `docs/architecture/audit-migration-supabase.md`
