# Runtime Integration Architecture — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.1  
> Escopo: runtime oficial em `packages/runtime/` + integração Headquarters.

## Objetivo

Criar o **Runtime oficial** da Douglas AI OS — responsável por manter todos os módulos **vivos durante a execução** da plataforma, após o Bootstrap (Sprint 5.0).

Sprint 5.1 é **integração pura**: nenhuma funcionalidade nova, nenhum domínio novo, nenhuma integração externa. Comunicação entre módulos exclusivamente via **abstrações existentes** (Corporate Event Bus).

## Pacote

```
packages/runtime/src/
├── RuntimeTypes.ts              # Estados, snapshots, labels
├── interfaces/
│   ├── IRuntimeEventBus.ts      # Abstração pub/sub (sem import de @douglas/events)
│   ├── IRuntimeRegistry.ts
│   ├── IRuntimeManager.ts
│   ├── IRuntimeMonitor.ts
│   └── IRuntimeLifecycle.ts     # Máquina de estados + RUNTIME_TRANSITIONS
├── RuntimeState.ts              # Estado global do runtime
├── RuntimeRegistry.ts           # Registro e snapshots por módulo
├── RuntimeLifecycle.ts          # Validação de transições
├── RuntimeMonitor.ts            # Health checks periódicos
├── RuntimeManager.ts            # Orquestrador
├── PlatformRuntime.ts           # Ponto de entrada
├── RuntimeContext.ts            # React context
├── RuntimeProvider.tsx
└── usePlatformRuntime.ts
```

## Integração Headquarters

```
BootstrapProvider
└── CoreProvider
    └── EventProvider
        └── RuntimeIntegration        ← Sprint 5.1
            └── RuntimeProvider
                └── ... (demais providers)
                    └── HeadquartersPage
                        ├── SystemStatusWidget       (Bootstrap)
                        └── RuntimeDashboardWidget   (Runtime)
```

```
apps/headquarters/features/platform-runtime/
├── modules.ts              # 10 módulos runtime (sem dependências diretas)
├── event-bus-adapter.ts    # Ponte IRuntimeEventBus → EventBus
├── RuntimeIntegration.tsx  # Gate: aguarda bootstrap + injeta event bus
└── index.ts
```

## Módulos conectados

| ID | Nome | Comunicação via Event Bus |
|----|------|---------------------------|
| `core` | Douglas Core | `system:health:check` |
| `dos` | Douglas Operating System | `internal:module:loaded/ready` |
| `brain` | Douglas Brain | `ai:inference:requested` |
| `plugins` | Plugin System | `internal:module:ready` |
| `agents` | Agent Framework | — |
| `workflow` | Workflow Engine | `workflow:started/completed` |
| `automation` | Automation Engine | `automation:triggered/completed` |
| `missions` | Mission Control | `internal:module:ready` |
| `analytics` | Analytics Engine | `workflow:completed` → health |
| `notifications` | Notification Center | `automation:completed` |

**Nenhum módulo importa outro.** Toda coordenação ocorre via tópicos do Corporate Event Bus.

## Estados por módulo

```
initializing → ready | failed
ready        → paused | restarting | stopping | failed
paused       → ready | stopping | failed
restarting   → ready | failed
stopping     → stopped | failed
stopped      → initializing | failed
failed       → initializing | restarting
```

| Estado | Significado |
|--------|-------------|
| `initializing` | Módulo em ativação |
| `ready` | Módulo vivo e operacional |
| `paused` | Módulo pausado (health degradado) |
| `restarting` | Reinício em andamento |
| `stopping` | Encerramento graceful |
| `stopped` | Módulo parado |
| `failed` | Falha na ativação ou operação |

## Fluxo de inicialização

```
1. BootstrapProvider conclui boot (isReady = true)
         │
         ▼
2. RuntimeIntegration habilita RuntimeProvider
         │
         ▼
3. PlatformRuntime.start({ platformVersion, modules })
         │
         ├── RuntimeState.beginStart()
         │
         ├── RuntimeRegistry.registerAll(modules)
         │
         └── Para cada módulo (sem ordem de dependência):
                 ├── status → initializing
                 ├── module.initialize(context)   ← context = event bus only
                 ├── module.start()
                 ├── status → ready
                 └── publish internal:module:ready
         │
         ├── RuntimeState.completeStart("running")
         ├── publish system:platform:ready
         └── RuntimeMonitor.start()  ← tick a cada 5s
         │
         ▼
4. RuntimeDashboardWidget consome usePlatformRuntime()
```

## Fluxo de encerramento

```
1. RuntimeProvider unmount / stop()
         │
         ▼
2. RuntimeMonitor.stop()
         │
         ▼
3. RuntimeState.beginStop()
         │
         └── Para cada módulo (ordem reversa):
                 ├── status → stopping
                 ├── module.stop()
                 └── status → stopped
         │
         ▼
4. RuntimeState.completeStop()
         │
         ▼
5. RuntimeShutdownReport gerado
```

## Atualização de estados

### Transições manuais (RuntimeManager)

```ts
manager.pauseModule("workflow");
manager.resumeModule("workflow");
manager.restartModule("agents");
manager.transitionModule("brain", "paused", "Manual pause");
```

Toda transição passa por `RuntimeLifecycle.assertTransition()`.

### Monitoramento automático (RuntimeMonitor)

A cada intervalo (5s):

1. Para módulos `ready`, executa `healthCheck()` se definido
2. Atualiza `health` no snapshot
3. Agrega health global via `resolveRuntimeHealth()`
4. Atualiza `RuntimeState.lastMonitorCheckAt`

## Monitoramento

```ts
interface RuntimeMonitorReport {
  status: RuntimeHealthStatus;
  healthyCount: number;
  degradedCount: number;
  unhealthyCount: number;
  modules: RuntimeModuleSnapshot[];
  checkedAt: string;
}
```

Acessível via:

```ts
const { state, monitorReport, isRunning } = usePlatformRuntime();
```

## RuntimeState global

```ts
interface GlobalRuntimeState {
  status: PlatformRuntimeStatus;   // offline | starting | running | ...
  platformVersion: string;
  startedAt?: string;
  stoppedAt?: string;
  uptimeMs: number;
  modules: RuntimeModuleSnapshot[];
  health: RuntimeHealthStatus;
  readyModuleCount: number;
  totalModuleCount: number;
  lastMonitorCheckAt?: string;
}
```

## Runtime Dashboard

Widget `RuntimeDashboardWidget` em `/headquarters`:

- Módulos carregados e status runtime
- Versão por módulo
- Uptime (plataforma e por módulo)
- Health agregado e por módulo
- Status da plataforma (`running`, `paused`, etc.)

## Como adicionar novos módulos ao Runtime

### Passo 1 — Definir módulo runtime

Em `apps/headquarters/features/platform-runtime/modules.ts`:

```ts
createModule("my-module", "My Module", "Description", (ctx) => {
  ctx.subscribe("system:platform:ready", () => {
    ctx.publish("internal:module:ready", { moduleId: "my-module" });
  });
}),
```

### Passo 2 — Sem dependências diretas

Não adicionar `dependencies: [...]`. Coordenação via eventos:

```ts
ctx.subscribe("internal:module:ready", (payload) => {
  if (payload.moduleId === "core") {
    // reagir quando core estiver pronto
  }
});
```

### Passo 3 — (Opcional) healthCheck

```ts
{
  ...createModule(...),
  healthCheck: () => "healthy",
  pause: async () => { /* mock */ },
  resume: async () => { /* mock */ },
  stop: async () => { /* graceful shutdown */ },
}
```

### Contrato `RuntimeModuleDefinition`

```ts
interface RuntimeModuleDefinition {
  id: string;
  name: string;
  version: string;
  initialize: (context: RuntimeModuleInitContext) => void | Promise<void>;
  start?: () => void | Promise<void>;
  stop?: () => void | Promise<void>;
  pause?: () => void | Promise<void>;
  resume?: () => void | Promise<void>;
  restart?: () => void | Promise<void>;
  healthCheck?: () => RuntimeHealthStatus;
}
```

## Inversão de dependência

`@douglas/runtime` **não importa** pacotes `@douglas/*`. A ponte para o Event Bus real fica na app:

```ts
// event-bus-adapter.ts
createRuntimeEventBusAdapter(eventBus: EventBus): IRuntimeEventBus
```

| Camada | Responsabilidade |
|--------|------------------|
| `@douglas/runtime` | Orquestração, lifecycle, monitor, state |
| `features/platform-runtime/` | Definições de módulos + adapter |
| `@douglas/events` | Corporate Event Bus (comunicação) |
| Providers React existentes | Runtime React dos domínios (inalterados) |

## Relação Bootstrap × Runtime

| Fase | Pacote | Pergunta respondida |
|------|--------|---------------------|
| **Boot** | `@douglas/bootstrap` | "Os módulos foram carregados?" |
| **Runtime** | `@douglas/runtime` | "Os módulos estão vivos?" |

Sequência: Bootstrap → Runtime → Providers React.

## Evolução futura

### 1. Boot paralelo de módulos independentes

Módulos sem coordenação via eventos podem ativar em `Promise.all`.

### 2. Health probes reais

Substituir mocks por chamadas a managers existentes via ServiceContainer.

### 3. Runtime CLI

```bash
pnpm platform:runtime status
pnpm platform:runtime pause workflow
```

### 4. Persistência de RuntimeState

Snapshot periódico para Analytics Engine.

### 5. Auto-restart em falha

`RuntimeMonitor` detecta `failed` → `restartModule()` automático.

### 6. Unificação com DOS Runtime

DOS possui `IRuntime` interno (Sprint 4.0). Futuro: adapter DOS → Platform Runtime registry.

## Testabilidade

```ts
const mockBus: IRuntimeEventBus = {
  publish: vi.fn(),
  subscribe: vi.fn(() => () => undefined),
};

const runtime = createPlatformRuntime({ eventBus: mockBus });
await runtime.start({ platformVersion: "0.1.0", modules: [mockModule] });

expect(runtime.getManager().isRunning()).toBe(true);
expect(runtime.getManager().getState().readyModuleCount).toBe(1);
```

## Preservação da arquitetura

Sprint 5.1 **não modifica** pacotes de domínio. Apenas:

- Adiciona `@douglas/runtime`
- Integra `RuntimeIntegration` no `AppShell` (dentro de `EventProvider`)
- Adiciona `RuntimeDashboardWidget` no Headquarters

Todos os contratos e providers anteriores permanecem intactos.
