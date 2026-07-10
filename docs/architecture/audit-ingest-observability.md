# Audit Ingest Observability — Douglas AI Platform

> Status: Architecture v1.0  
> Sprint: 5.36  
> Escopo: observabilidade operacional sem serviço externo, sem PII, sem secrets.

## Objetivo

Tornar visível o fluxo:

```
Headquarters → Audit Adapter → Edge Function audit-ingest → Supabase
                              ↓
                    accepted / rejected / error
                              ↓
                    fallback localStorage (quando remoto falha)
```

Duas camadas complementares:

| Camada | Onde | Persistência |
|--------|------|--------------|
| **Server-side** | Logs JSON Deno (`console.log`) | Supabase Dashboard / log drain |
| **Client-side** | `AuditIngestObservabilityStore` | Sessão browser (memória) |

## Logs server-side (Edge Function)

Emitidos via `emitAuditIngestStructuredLog()` em `audit-ingest`:

```json
{
  "event": "audit_ingest",
  "timestamp": "2026-07-10T12:00:00.000Z",
  "status": "accepted",
  "latencyMs": 142,
  "authMode": "optional",
  "auditId": "…",
  "requestId": "…",
  "correlationId": "…",
  "authorizedRole": "admin",
  "errorCode": "invalid_payload"
}
```

### Nunca registrado

- JWT / tokens
- anon key / service_role
- Senhas
- Payload completo
- Email / UID
- Metadata sensível

### Campos operacionais

| Campo | Descrição |
|-------|-----------|
| `event` | Sempre `audit_ingest` |
| `status` | `accepted` \| `rejected` \| `error` |
| `latencyMs` | Tempo total do handler POST |
| `authMode` | `disabled` \| `optional` \| `required` |
| `authorizedRole` | Role do profile quando autenticado — **não** email/UID |

## Métricas locais (`@douglas/audit`)

### Tipos

| Tipo | Arquivo |
|------|---------|
| `AuditIngestOutcome` | `accepted` \| `rejected` \| `fallback` \| `failed` |
| `AuditIngestMetric` | Registro de uma tentativa |
| `AuditIngestObservabilitySnapshot` | Agregado da sessão |
| `AuditIngestObservabilityStore` | Store in-memory + listeners |

### Contadores da sessão

- `totalAttempts` — invocações remotas via adapter
- `accepted` / `rejected` / `failed` — outcome primário
- `fallback` — incrementado quando `usedFallback: true` após falha remota
- `lastLatencyMs`, `lastErrorCode`, `lastError` (sanitizado)

Registrado em `CompositeAuditPersistenceAdapter.appendToSupabase()` após cada `appendAsync`.

## Event Bus

Topics publicados (source: `audit`):

- `audit:ingest:accepted`
- `audit:ingest:rejected`
- `audit:ingest:fallback`
- `audit:ingest:failed`

Payload: `AuditIngestTelemetryEventPayload` — IDs de correlação + outcome, sem PII.

### Prevenção de loops

1. `isAuditedEventTopic()` **exclui** `audit:ingest:*`
2. `shouldExcludeTopicFromAuditMapping()` em `@douglas/audit`
3. Telemetria **não** chama `auditLog.record()`

Eventos aparecem no Live Event Monitor, mas não geram novos audit entries.

## Headquarters UI

**Audit Ingest Observability** (`AuditIngestObservabilityWidget`)

- Status geral da sessão
- Contadores accepted / rejected / fallback / failed
- Última latência e erro sanitizado
- Aviso: métricas = sessão atual apenas

Complementa `AuditTrailWidget` (entries) e `ProductionSafetyWidget` (readiness).

## Production Safety Gate (Sprint 5.36)

Checks adicionais — **apenas warn**, nunca bloqueiam por amostra insuficiente:

| Check | Pass | Warn |
|-------|------|------|
| `audit_ingest_accepted_observed` | ≥1 accepted na sessão | 0 tentativas ou 0 accepted |
| `audit_ingest_failure_rate` | ≤50% com ≥3 tentativas | Taxa alta ou amostra <3 |
| `audit_ingest_no_critical_errors` | Sem errorCode crítico | `profile_not_found`, `role_not_allowed`, etc. |

## Privacidade

- Cliente: `sanitizeAuditErrorForDisplay()` antes de UI/store
- Servidor: mensagens genéricas + códigos estáveis
- Store: não persiste payload, tokens ou email

## Limites (sem plataforma externa)

- Métricas client **não sobrevivem** reload da página
- Sem Datadog/Prometheus nesta sprint
- Logs server-side dependem de infra Supabase
- Taxa de falha no Safety Gate usa amostra da sessão HQ apenas

## Evolução futura

- Persistência de métricas agregadas (Postgres / analytics)
- Export OTEL / OpenMetrics
- Dashboard cross-session
- Alertas automáticos on-call

## Referências

- [audit-edge-function.md](./audit-edge-function.md)
- [audit-edge-role-authorization.md](./audit-edge-role-authorization.md)
- [audit-migration-supabase.md](./audit-migration-supabase.md)
- [production-safety-gate.md](../operations/production-safety-gate.md)
