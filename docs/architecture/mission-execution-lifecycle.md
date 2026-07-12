# Mission Execution Lifecycle

Sprint 5.48 — fluxo determinístico de execução de missões na Douglas AI Platform.

## Visão geral

```
Operador → Request → Created → Validated → Planned → Assigned → Running → Completed/Failed/Cancelled
                ↓         ↓          ↓         ↓         ↓          ↓
           Event Bus   Audit    Timeline   Board sync   Progress
```

O `MissionExecutionCoordinator` orquestra o ciclo completo sem conectar serviços externos de IA.

## Estados de execução

| Status | Descrição |
|--------|-----------|
| `created` | Execução registrada |
| `validated` | Missão validada |
| `planned` | Plano construído |
| `assigned` | Agente atribuído |
| `running` | Passos em execução |
| `completed` | Sucesso |
| `failed` | Falha controlada |
| `cancelled` | Cancelada pelo operador |

## Mapeamento para Mission Board

| Execução | Board (`MissionStatus`) |
|----------|-------------------------|
| created, validated, planned | `planned` |
| assigned, running | `active` |
| failed, cancelled | `blocked` |
| completed | `completed` |

Estados legados (`planned`, `active`, `blocked`, `completed`) permanecem no contrato público do `@douglas/missions`.

## No-op guard do Mission Board (Patch 5.49.1)

`MissionStatusTransitionPolicy` avalia cada mudança de status do board antes de persistir:

| Decisão | Comportamento |
|---------|---------------|
| `noop` | Estado igual (ex.: `active → active`) — sem timeline, sem `updatedAt`, sem evento |
| `apply` | Transição válida — uma entrada de timeline |
| `reject` | Transição inválida — operação ignorada (sem regressão silenciosa) |

Transições válidas preservadas:

- `draft → planned`
- `planned → active`
- `active → blocked` | `active → completed`
- `blocked → active` | `blocked → completed`

O coordinator usa `syncMissionBoard()` com esta policy — elimina duplicatas causadas por `start()` + `syncMissionBoard()` ou `complete()` + `syncMissionBoard()` na mesma execução.

## Timeline mission-centric (Patch 5.49.1)

Marcos explícitos na timeline (tipo `note`):

- Agente atribuído
- Execução iniciada
- Missão concluída / falhou / cancelada

Eventos `mission:progress` atualizam progresso no board, mas **não** geram audit explícito (volume controlado).

## Identidade e correlação

Cada execução possui:

- `missionId`, `executionId`, `correlationId`, `requestId`
- `createdBy` (abreviado), `assignedAgentId`
- timestamps, `currentStep`, `progress`, `resultSummary`, `sanitizedError`

Payloads de eventos e audit **não** expõem tokens, keys, e-mail ou UID completo.

## Idempotência

- `MissionExecutionRegistry` — estado em memória por `executionId`
- `MissionExecutionIdempotencyGuard` — política de duplicidade
- Mesmo `executionId` não reexecuta após conclusão (retorna resultado anterior)
- Missão em `running` rejeita nova execução (`mission:duplicate_rejected`)
- Retry explícito (`isRetry: true`) gera nova tentativa com `attempt` incrementado

## Event Bus

Tópicos tipados em `DouglasEventMap`:

- `mission:created`, `mission:validated`, `mission:planned`, `mission:assigned`
- `mission:started`, `mission:progress`, `mission:completed`, `mission:failed`
- `mission:cancelled`, `mission:duplicate_rejected`

Payload mínimo: `MissionLifecycleEventPayload`. Eventos emitidos pelo coordinator incluem `audited: true` para evitar loop com `AuditEventMapper`.

## Auditoria exactly-once (Patch 5.49.1)

Estratégia de duas camadas:

1. **Event Bus** — eventos `mission:*` e `agent:*` publicados com `audited: true`. O `AuditEventMapper` retorna `null` para estes payloads, impedindo loop Event Bus → Audit → Event Bus.
2. **Caminho explícito** — `MissionExecutionCoordinator.appendAudit()` registra lifecycle (`mission:created` … `mission:cancelled`, exceto `mission:progress`). No HQ, `MissionExecutionIntegration` conecta `appendAudit` ao `auditLog.record()`. Eventos `agent:*` de lifecycle são auditados no wrapper de publish do runtime.

Cada evento operacional relevante gera **no máximo uma** entrada de audit. Progresso (`mission:progress`, `agent:progress`) publica no Event Bus para monitoramento, mas não duplica audit.

## Persistência

Contrato: `MissionExecutionPersistenceAdapter`

Implementações atuais:

- `InMemoryMissionExecutionPersistence`
- `SessionMissionExecutionPersistence` (sessionStorage)
- `CompositeMissionExecutionPersistence`

**Limitação:** sem migration Supabase nesta sprint. O contrato prepara persistência futura remota.

## Missão demonstrativa

Tipo: `operational_diagnostic`  
Título: *Executar diagnóstico operacional da Douglas AI OS*  
Agente: `system-diagnostics-agent`  
Executor determinístico — passos read-only via Operational Agent Runtime, sem IA externa.

## Adicionar novos tipos de missão

1. Implementar `IMissionStepExecutor` com `missionType` único
2. Registrar em `MissionExecutorRegistry`
3. Estender RBAC em `MissionExecutionAccessPolicy` se necessário
4. Adicionar testes de fluxo e idempotência
5. (Futuro) persistência Supabase via adapter dedicado

## Componentes

| Módulo | Responsabilidade |
|--------|------------------|
| `MissionExecutionCoordinator` | Orquestração |
| `MissionExecutionIdempotencyGuard` | Duplicidade |
| `MissionStatusTransitionPolicy` | No-op guard do board |
| `MissionExecutionAuditPolicy` | Exactly-once audit lifecycle |
| `DiagnosticMissionExecutor` | Missão diagnóstica via agent runtime |
| `MissionExecutionWidget` | UI Headquarters |
| `MissionExecutionIntegration` | Provider + Event Bus + audit explícito |
