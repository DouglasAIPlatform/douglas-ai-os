# Operational Event Contracts — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.16  
> Escopo: contratos canônicos da camada operacional (Event Bus).

## Fonte canônica de tipos

| Pacote | Arquivo | Papel |
|--------|---------|-------|
| `@douglas/events` | `OperationalEventTypes.ts` | Payloads e unions compartilhados |
| `@douglas/events` | `TypedEvents.ts` | `DouglasEventMap` — tópico → payload |
| `@douglas/security` | Re-exporta tipos de `@douglas/events` | Publicação security:action:* |
| `@douglas/audit` | `AuditEventMapper.ts` | Consumo → `AuditEntry` |
| Headquarters | `event-bus-bridge.ts` | Event Bus → `LiveEvent` (Monitor) |

## Padrão de naming

```
<domínio>:<recurso>:<verbo>
```

| Domínio | Exemplos |
|---------|----------|
| `runtime` | `runtime:action:started` |
| `security` | `security:action:allowed` |
| `diagnostics` | `diagnostics:report:completed` |

Constantes: `SECURITY_ACTION_EVENT_TOPICS`, `RUNTIME_ACTION_EVENT_TOPICS`, `DIAGNOSTICS_REPORT_EVENT_TOPICS`.

---

## Eventos de runtime

| Tópico | Publisher | Payload mínimo |
|--------|-----------|----------------|
| `runtime:action:started` | `RuntimeControlService` | `commandId`, `moduleId`, `action` |
| `runtime:action:completed` | idem | + `success`, `durationMs`, `message?` |
| `runtime:action:failed` | idem | + `message?` |

```typescript
interface RuntimeActionEventPayload {
  commandId: string;      // required
  moduleId: string;       // required — target
  action: RuntimeActionType; // required
  message?: string;
  success?: boolean;      // completed
  durationMs?: number;    // completed
}
```

**Audit mapping:** `actor=Runtime Engine`, `target=moduleId`, `metadata.commandId`.

**Monitor:** `demo: false`, payload copiado para `LiveEvent.metadata`.

---

## Eventos de security

| Tópico | Quando | auditId | requestId | correlationId | risk |
|--------|--------|---------|-----------|---------------|------|
| `security:action:confirmation_requested` | Modal aberto | ✓ | ✓ | ✓ (= requestId) | ✓ |
| `security:action:confirmed` | Operador confirmou | ✓ | ✓ | ✓ | — |
| `security:action:cancelled` | Operador cancelou | ✓ | ✓ | ✓ | — |
| `security:action:allowed` | Permissão OK, pré-execução | ✓ | opcional | opcional | — |
| `security:action:blocked` | Sem permissão | ✓ | — | — | — |

```typescript
interface SecurityActionEventPayload {
  operatorId: string;       // required
  operatorRole: OperatorRole; // required
  moduleId: string;         // required — target
  action: SecuredActionType; // required
  operatorName?: string;    // display amigável
  message?: string;
  auditId?: string;         // ActionAuditLog entry id
  requestId?: string;       // ActionConfirmationRequest.id
  correlationId?: string;   // fluxo completo (tipicamente = requestId)
  risk?: ActionConfirmationRiskLevel; // só confirmation_requested
}
```

**Publisher:** `SecurityLayer` via `SecurityIntegration` (source: `authentication`).

**Event metadata:** `correlationId` duplicado em `event.metadata.correlationId` para consumidores genéricos.

**Audit mapping:**

| Campo AuditEntry | Origem |
|------------------|--------|
| `actor` | `operatorName` ou `operatorId` |
| `role` | `operatorRole` |
| `target` | `moduleId` |
| `metadata.auditId` | payload |
| `metadata.requestId` | payload |
| `metadata.correlationId` | metadata ou payload |

---

## Eventos de diagnostics

| Tópico | Payload mínimo |
|--------|----------------|
| `diagnostics:report:started` | `reportId` |
| `diagnostics:report:completed` | `reportId`, `ready`, `score`, `status` |
| `diagnostics:report:failed` | `reportId`, `message?` |

```typescript
interface DiagnosticsReportEventPayload {
  reportId: string;
  ready: boolean;
  score: number;
  status: ReadinessStatus; // ready | degraded | not_ready
  message?: string;
  durationMs?: number;
}
```

**Audit derivados (mapper):**

- `diagnostics_critical_issue` — quando `not_ready` ou `report:failed`
- `readiness_status_changed` — quando `status` ou `ready` mudam vs estado anterior

---

## Eventos de audit (Operational Audit Log)

O audit **não publica** no Event Bus — **consome** eventos acima e normaliza:

```typescript
interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  source: AuditSource;    // security | runtime | diagnostics | platform
  action: AuditAction;
  target: string;
  severity: AuditSeverity;
  message: string;
  metadata: Record<string, unknown>; // auditId, requestId, correlationId, eventId, topic, ...
}
```

Persistência local: `LocalStorageAuditPersistenceAdapter` (Sprint 5.14).

---

## Event Monitor (LiveEvent)

Eventos do Bus mapeados via `mapBusEventToLiveEvent`:

| Campo | Valor |
|-------|-------|
| `demo` | sempre `false` para Event Bus |
| `metadata` | payload + `category` + `correlationId` + `auditId` + `requestId` |

Eventos demo (`demo: true`) vêm apenas de seeds/ticker — controlados por `@douglas/demo-data` (Sprint 5.15).

---

## IDs de correlação

| ID | Gerado por | Propaga para |
|----|------------|--------------|
| **auditId** | `ActionAuditLog.record*()` | payload security + audit metadata |
| **requestId** | `ActionConfirmation.createRequest()` | payload + ActionAuditEntry |
| **correlationId** | `requestId` no fluxo de confirmação | payload + `event.metadata` + audit |

Fluxo típico (ação sensível):

```
confirmation_requested (auditId, requestId, correlationId)
        ↓
confirmed | cancelled (mesmos IDs)
        ↓
allowed (correlationId herdado)
        ↓
runtime:action:* (commandId independente)
```

---

## Compatibilidade

- `@douglas/security` importa tipos de `@douglas/events` — **não duplicar** `SecurityActionEventPayload`.
- Campos opcionais ausentes não quebram consumidores — mappers usam fallbacks.
- Novos tópicos operacionais: adicionar em `OperationalEventTypes.ts` + `DouglasEventMap` + mapper audit + bridge monitor.
