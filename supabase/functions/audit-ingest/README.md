# audit-ingest — Edge Function

> Sprint 5.24 + 5.27 + **5.33 production hardening**. Deploy manual.

## Contrato HTTP

| Item | Valor |
|------|-------|
| Método | `POST` (OPTIONS preflight) |
| Body | JSON `AuditEntry` |
| Sucesso | `{ success: true, status: "accepted", auditId, requestId?, correlationId? }` |
| Erro | `{ success: false, status, message, errorCode }` — mensagens sanitizadas |

## errorCode (Sprint 5.33)

`method_not_allowed` · `cors_rejected` · `missing_auth` · `invalid_payload` · `insert_failed` · `internal_error`

## Secrets (runtime only)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `AUDIT_INGEST_CORS_ORIGIN` | `*` | Allowlist — origin ou lista CSV |
| `AUDIT_INGEST_REQUIRE_JWT` | off | `"true"` → Bearer obrigatório |
| `AUDIT_INGEST_MAX_METADATA_BYTES` | 8192 | Limite metadata |

Auto-injetadas: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

## Deploy staging

```bash
supabase secrets set AUDIT_INGEST_CORS_ORIGIN=http://localhost:3000,https://hq.staging.example.com
# supabase secrets set AUDIT_INGEST_REQUIRE_JWT=true
supabase functions deploy audit-ingest
```

## Referências

- `docs/architecture/audit-edge-function.md`
