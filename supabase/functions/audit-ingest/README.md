# audit-ingest — Edge Function

> Sprint 5.24 + 5.27 + 5.33 + **5.35 role authorization**. Deploy manual.

## Contrato HTTP

| Item | Valor |
|------|-------|
| Método | `POST` (OPTIONS preflight) |
| Body | JSON `AuditEntry` |
| Sucesso | `{ success: true, status: "accepted", auditId, requestId?, correlationId? }` |
| Erro | `{ success: false, status, message, errorCode }` — mensagens sanitizadas |

## errorCode

**5.33:** `method_not_allowed` · `cors_rejected` · `missing_auth` · `invalid_payload` · `insert_failed` · `internal_error`

**5.35:** `invalid_token` · `profile_not_found` · `profile_inactive` · `role_not_allowed` · `actor_resolution_failed`

## Secrets (runtime only)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `AUDIT_INGEST_CORS_ORIGIN` | `*` | Allowlist — origin ou lista CSV |
| `AUDIT_INGEST_AUTH_MODE` | `optional` | `disabled` \| `optional` \| `required` |
| `AUDIT_INGEST_REQUIRE_JWT` | off | Legado — `"true"` → `required` |
| `AUDIT_INGEST_MAX_METADATA_BYTES` | 8192 | Limite metadata |

Auto-injetadas: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

## Deploy staging

```bash
supabase secrets set AUDIT_INGEST_CORS_ORIGIN=http://localhost:3000,https://hq.staging.example.com
supabase secrets set AUDIT_INGEST_AUTH_MODE=required
supabase functions deploy audit-ingest
```

## Referências

- `docs/architecture/audit-edge-function.md`
- `docs/architecture/audit-edge-role-authorization.md`
