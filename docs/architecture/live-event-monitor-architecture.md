# Live Event Monitor Architecture — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.4  
> Escopo: live event monitor em `packages/monitor/` + integração Headquarters.

## Objetivo

Criar o **Live Event Monitor** da Douglas AI OS — responsável por exibir **eventos internos** da plataforma em tempo quase real, sem WebSocket, banco ou APIs externas.

Complementa o Corporate Event Bus (`@douglas/events`) com uma camada de observabilidade para Headquarters.

## Pacote

```
packages/monitor/src/
├── MonitorTypes.ts          # LiveEvent, severities, sources
├── EventSeverity.ts         # Resolução e labels de severidade
├── EventSource.ts           # createLiveEvent, module sources
├── EventLog.ts              # Armazenamento circular (500)
├── EventStream.ts           # Pub/sub interno do monitor
├── EventTimeline.ts         # Ordenação + EventFilter
├── EventFilter.ts           # Re-export (filtros futuros)
├── EventInspector.ts        # Inspeção detalhada de eventos
├── EventMonitor.ts          # Orquestrador
├── EventMonitorProvider.tsx
└── useLiveEventMonitor.ts
```

## Integração Headquarters

```
EventProvider                    ← Corporate Event Bus
└── EventMonitorIntegration      ← Sprint 5.4
    ├── EventMonitorProvider
    ├── EventBusBridge           ← subscribeAll → ingest
    └── RuntimeIntegration
        └── ... providers ...
            └── HeadquartersPage
                └── LiveEventMonitorWidget
```

```
apps/headquarters/features/platform-monitor/
├── seeds.ts                   # 12 eventos seed + mock rotation
├── event-bus-bridge.ts        # Event → LiveEvent
├── EventMonitorIntegration.tsx
└── index.ts
```

## Fontes de eventos (12 módulos)

| Source | Módulo |
|--------|--------|
| `core` | Douglas Core |
| `dos` | Douglas Operating System |
| `runtime` | Platform Runtime |
| `brain` | Douglas Brain |
| `agents` | Agent Framework |
| `missions` | Mission Control |
| `workflow` | Workflow Engine |
| `automation` | Automation Engine |
| `analytics` | Analytics Engine |
| `notifications` | Notification Center |
| `plugins` | Plugin System |
| `health` | Health Engine |

## Modelo de evento

```ts
interface LiveEvent {
  id: string;
  source: MonitorModuleSource;
  type: string;
  severity: "info" | "success" | "warning" | "error" | "critical";
  message: string;
  timestamp: string;
  metadata: Record<string, string | number | boolean | null>;
}
```

## Fluxo de dados

```
1. Seeds mockados carregados no EventMonitorProvider
         │
         ▼
2. EventBusBridge subscribeAll(EventBus)
         │
         ├── mapBusEventToLiveEvent()
         └── monitor.ingest()
         │
         ▼
3. EventMonitor
         ├── EventLog.append()
         └── EventStream.emit()
         │
         ▼
4. Mock ticker (8s) — eventos internos rotativos
         │
         ▼
5. LiveEventMonitorWidget ← useLiveEventMonitor()
```

## Relação com Event Bus

| Camada | Pacote | Papel |
|--------|--------|-------|
| **Corporate Event Bus** | `@douglas/events` | Pub/sub tipado entre módulos |
| **Live Event Monitor** | `@douglas/monitor` | Observabilidade e timeline para HQ |

O monitor **não substitui** o Event Bus — **observa** eventos publicados via bridge na app:

```ts
subscribeAll((event) => {
  monitor.ingest(mapBusEventToLiveEvent(event));
});
```

Inversão de dependência: `@douglas/monitor` não importa `@douglas/events`.

## Filtros futuros

`EventFilter` já suporta (UI pendente):

```ts
interface EventFilterCriteria {
  source?: MonitorModuleSource;   // módulo
  severity?: EventSeverity;       // severidade
  type?: string;                  // tipo de evento
  periodStart?: string;           // período início
  periodEnd?: string;             // período fim
}

monitor.setFilter({ source: "workflow", severity: "warning" });
```

## Como novos módulos publicam eventos

### Via Event Bus (recomendado)

```ts
// No módulo — via EventProvider
publish("workflow:started", "workflow", {
  workflowId: "wf-1",
  executionId: "exec-1",
});

// Automaticamente capturado pelo EventBusBridge → LiveEventMonitor
```

### Via ingest direto (mock/teste)

```ts
monitor.ingest(createLiveEvent({
  source: "my-module",
  type: "my-module:ready",
  severity: "success",
  message: "Module ready",
  metadata: { version: "0.1.0" },
}));
```

### Bridge customizado

Estender `mapBusEventToLiveEvent()` em `event-bus-bridge.ts` para novos tópicos.

## Uso futuro para diagnósticos

| Cenário | Como o monitor ajuda |
|---------|---------------------|
| **Incident response** | Timeline mostra sequência de eventos antes de falha |
| **Correlação Health + Events** | Health Engine critical → filtrar eventos `error`/`critical` |
| **Runtime debugging** | Eventos de boot/runtime visíveis em tempo quase real |
| **Audit trail** | EventLog mantém histórico circular (500 eventos) |
| **EventInspector** | Análise de eventos relacionados por source/type |

Evolução futura:

1. Exportar timeline para Analytics Engine
2. Filtros interativos no widget
3. Persistência opcional (fora do escopo atual)
4. Correlação com Dependency Graph (impacto downstream)

## LiveEventMonitorWidget

Exibe em `/headquarters`:

- Últimos 20 eventos (timeline)
- Origem do evento
- Severidade
- Horário
- Mensagem resumida
- Total de eventos + último timestamp

## Testabilidade

```ts
const monitor = createEventMonitor();
monitor.seed([createLiveEvent({ /* ... */ })]);
monitor.ingest(createLiveEvent({ /* ... */ }));

const snapshot = monitor.getSnapshot();
expect(snapshot.totalCount).toBe(2);
```

## Preservação da arquitetura

Sprint 5.4 **não modifica**:

- `@douglas/events` (Event Bus intacto)
- `@douglas/runtime`, `@douglas/core`
- Pacotes de domínio

Apenas adiciona `@douglas/monitor`, bridge na app e widget no Headquarters.

## Sequência da plataforma

| Sprint | Papel |
|--------|-------|
| 5.0 Bootstrap | Carrega módulos |
| 5.1 Runtime | Mantém vivos |
| 5.2 Health | Avalia saúde |
| 5.3 Graph | Mapeia dependências |
| **5.4 Monitor** | Exibe eventos internos |
