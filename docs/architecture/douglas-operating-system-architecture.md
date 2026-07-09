# Douglas Operating System (DOS) Architecture

> Status: Foundation v0.1  
> Sprint: 4.0  
> Escopo: camada de orquestração em `packages/dos/`.

## Objetivo

Criar o **Douglas Operating System (DOS)** — a camada que orquestra toda a Douglas AI Platform sem alterar o Core nem os pacotes de domínio.

O DOS:

- Inicializa módulos registrados (ordem topológica por dependências)
- Valida plugins antes do registro
- Monitora saúde da plataforma
- Expõe estado global do sistema
- Gerencia ciclo de vida completo (boot → running → shutdown)

Nesta sprint **não há integração** com AppShell, Event Bus, Core Engine ou providers de domínio. A entrega é arquitetura pura baseada em **inversão de dependência**.

## Pacote

```
packages/dos/src/
├── DOSTypes.ts                 # Tipos, fases, estado global
├── interfaces/
│   ├── IModuleRegistry.ts
│   ├── IModuleLoader.ts
│   ├── IModuleManager.ts
│   ├── IPluginValidator.ts     # IPluginRegistry
│   ├── IHealthMonitor.ts
│   ├── IRuntime.ts
│   ├── IPlatformStatus.ts
│   ├── IDiagnostics.ts
│   ├── ILifecycleManager.ts
│   ├── IBootManager.ts
│   ├── IShutdownManager.ts
│   ├── IVersionManager.ts
│   ├── IEventPublisher.ts
│   └── IKernel.ts              # IOperatingSystem
├── InMemoryModuleRegistry.ts
├── DefaultModuleLoader.ts
├── ModuleManager.ts
├── DefaultPluginValidator.ts
├── HealthMonitor.ts
├── Runtime.ts
├── PlatformStatus.ts
├── Diagnostics.ts
├── LifecycleManager.ts
├── BootManager.ts
├── ShutdownManager.ts
├── VersionManager.ts
├── InMemoryEventPublisher.ts
├── Kernel.ts
├── OperatingSystem.ts
├── DOSProvider.tsx
├── DOSStatusPanel.tsx
└── index.ts
```

## Seeds (app)

```
apps/headquarters/features/dos/
├── seeds.ts    # Módulos (de core) + plugins (Calma, YouTube, CRM)
└── index.ts
```

Sem wiring no `AppShell` nesta sprint.

## Posição na arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  Douglas Operating System (DOS)          ← Sprint 4.0       │
│  Orquestra boot, lifecycle, health, plugins                 │
├─────────────────────────────────────────────────────────────┤
│  Plugins (@douglas/plugins)              ← Sprint 3.9       │
│  Analytics / Notifications               ← Sprints 3.7–3.8   │
│  Corporate Event Bus (@douglas/events)   ← Sprint 3.6        │
│  Douglas Core (@douglas/core)            ← Sprint 3.5        │
│  Domain packages (agents, workflow…)     ← Sprints 3.0–3.4   │
└─────────────────────────────────────────────────────────────┘
```

O DOS **não importa** nenhum pacote `@douglas/*`. Integração futura via **adapters** na camada app.

## Componentes

### OperatingSystem

Ponto de entrada. Compõe o `Kernel` e expõe API de alto nível:

```ts
const os = createOperatingSystem({ platformVersion: "0.1.0" });

const result = os.boot({ modules, plugins });
os.isReady();           // true quando status === "ready"
os.getState();          // PlatformState global
os.getHealthReport();   // HealthReport agregado
os.shutdown();          // encerramento ordenado
```

### Kernel

Coordena todos os subsistemas via **interfaces injetáveis**:

| Subsistema | Interface | Implementação default |
|------------|-----------|----------------------|
| Módulos | `IModuleManager` | `ModuleManager` |
| Plugins | `IPluginValidator`, `IPluginRegistry` | `DefaultPluginValidator`, `InMemoryPluginRegistry` |
| Saúde | `IHealthMonitor` | `HealthMonitor` |
| Runtime | `IRuntime` | `Runtime` |
| Estado | `IPlatformStatus` | `PlatformStatus` |
| Diagnósticos | `IDiagnostics` | `Diagnostics` |
| Lifecycle | `ILifecycleManager` | `LifecycleManager` |
| Boot | `IBootManager` | `BootManager` |
| Shutdown | `IShutdownManager` | `ShutdownManager` |
| Versão | `IVersionManager` | `VersionManager` |
| Eventos | `IEventPublisher` | `InMemoryEventPublisher` |

```ts
interface IKernel {
  readonly moduleManager: IModuleManager;
  readonly pluginValidator: IPluginValidator;
  readonly pluginRegistry: IPluginRegistry;
  readonly healthMonitor: IHealthMonitor;
  readonly runtime: IRuntime;
  readonly platformStatus: IPlatformStatus;
  readonly diagnostics: IDiagnostics;
  readonly lifecycleManager: ILifecycleManager;
  readonly bootManager: IBootManager;
  readonly shutdownManager: IShutdownManager;
  readonly versionManager: IVersionManager;
  readonly eventPublisher: IEventPublisher;
}
```

### ModuleManager

Facade sobre `IModuleRegistry` + `IModuleLoader`:

- `register(modules)` — registra definições
- `loadAll()` — carrega em ordem topológica
- `getReadyModules()` — módulos com status `ready`

### LifecycleManager

Máquina de estados por módulo:

```
registered → loading → loaded → ready
ready → stopping → stopped → registered
qualquer → error | disabled
```

Transições inválidas lançam erro — garante ciclo de vida previsível.

### BootManager

Sequência de boot:

```
1. validating_plugins   → IPluginValidator.validate() por manifest
2. loading_modules      → ModuleManager.loadAll() (topological sort)
3. initializing_runtime → Runtime.markBooted()
4. running_health_check → IHealthMonitor.run()
5. complete | failed
```

Emite eventos via `IEventPublisher` (`dos:boot:started`, `dos:platform:ready`, etc.).

### ShutdownManager

Sequência inversa:

```
1. stopping_modules  → ready → stopping → stopped (ordem reversa)
2. cleanup           → Runtime.markStopped()
3. complete
```

### HealthMonitor

Agrega saúde por módulo:

| Status do módulo | Saúde |
|------------------|-------|
| `ready`, `loaded` | healthy |
| `loading`, `registered`, `stopping` | degraded |
| `error`, `disabled` | unhealthy |

Overall: pior status entre módulos.

### PlatformStatus

Estado global reativo:

```ts
interface PlatformState {
  status: "offline" | "booting" | "ready" | "degraded" | "shutting_down" | "error";
  bootPhase: BootPhase;
  shutdownPhase: ShutdownPhase;
  runtimePhase: RuntimePhase;
  health: PlatformHealthStatus;
  moduleCount: number;
  readyModuleCount: number;
  pluginCount: number;
  validatedPluginCount: number;
  bootedAt?: string;
  lastHealthCheckAt?: string;
}
```

### Diagnostics

Trilha de auditoria do boot/shutdown (cap. 500 entradas):

```ts
diagnostics.record({
  level: "info" | "warn" | "error",
  source: "BootManager",
  message: "...",
});
```

### VersionManager

```ts
interface VersionInfo {
  platform: string;   // versão da plataforma
  dos: string;        // versão do DOS
  kernel: string;     // versão do kernel
  environment: string;
}
```

## Inversão de dependência

Nenhum subsistema conhece implementações concretas de outro. O `Kernel` aceita injeção:

```ts
const os = createOperatingSystem({
  moduleRegistry: customRegistry,      // adapter para @douglas/core
  pluginValidator: customValidator,    // adapter para @douglas/plugins
  healthMonitor: customHealthMonitor,
  eventPublisher: coreEventBridge,     // bridge para Event Bus
  platformVersion: "1.0.0",
  environment: "production",
});
```

Implementações default (`InMemory*`) permitem boot standalone sem dependências externas.

## Como novos módulos participam do ciclo de vida

### 1. Definir o módulo como `IManagedModule`

```ts
const myModule: IManagedModule = {
  id: "my-module",
  name: "My Module",
  description: "Descrição do módulo.",
  version: "1.0.0",
  dependencies: ["authentication"],  // IDs de módulos que devem carregar antes
  status: "registered",
  packageName: "@douglas/my-module",
};
```

### 2. Declarar dependências

O `DefaultModuleLoader.resolveLoadOrder()` faz **topological sort**. Módulos com `dependencies: ["memory", "agents"]` só carregam após memory e agents estarem `ready`.

Ordem atual (de `features/core/modules.ts`):

```
authentication → memory → agents → workflow → automation → brain → search → notifications → analytics
```

### 3. Incluir no boot do DOS

```ts
os.boot({
  modules: [...existingModules, myModule],
  plugins: [...existingPlugins],
});
```

### 4. Ciclo de vida automático

Durante `loadModule()`:

```
registered → loading → loaded → ready
```

Eventos emitidos: `dos:module:loading`, `dos:module:ready`.

### 5. Participação no health check

Após boot, `HealthMonitor.run()` inclui automaticamente todos os módulos registrados. Módulos em `error` degradam a plataforma.

### 6. Shutdown ordenado

`ShutdownManager` para módulos em **ordem reversa** de carregamento:

```
ready → stopping → stopped
```

### 7. Adapter para Core (integração futura)

```ts
// Pseudocode — camada app, não no pacote DOS
class CoreModuleRegistryAdapter implements IModuleRegistry {
  constructor(private core: CoreEngine) {}
  getAll() {
    return core.registry.getAll().map(toManagedModule);
  }
  // ...
}
```

Permite DOS e Core compartilharem visão de módulos sem acoplamento.

## Como plugins participam do ciclo de vida

### 1. Definir manifest compatível com `IPluginManifestContract`

```ts
const plugin: IPluginManifestContract = {
  id: "my-product",
  name: "My Product",
  description: "...",
  version: "1.0.0",
  routes: [{ id: "home", path: "/my-product" }],
  menus: [{ id: "menu:home", routeId: "home" }],
};
```

### 2. Validação no boot (fase 1)

`IPluginValidator.validate()` verifica:

- Campos obrigatórios (`id`, `name`, `version`)
- Menus referenciam rotas existentes

Plugins inválidos vão para `pluginRegistry.getRejected()` — **não bloqueiam** boot de módulos válidos.

### 3. Registro após validação

Plugins válidos ficam em `pluginRegistry.getValidated()` — prontos para consumo futuro por `@douglas/plugins` PluginManager.

## Eventos do DOS

| Topic | Quando |
|-------|--------|
| `dos:boot:started` | Início do boot |
| `dos:plugin:validated` | Plugin aceito |
| `dos:plugin:rejected` | Plugin rejeitado |
| `dos:module:loading` | Módulo entrando em loading |
| `dos:module:ready` | Módulo pronto |
| `dos:health:check` | Health check concluído |
| `dos:platform:ready` | Plataforma operacional |
| `dos:boot:complete` | Boot finalizado |
| `dos:boot:failed` | Boot falhou |
| `dos:shutdown:started` | Início do shutdown |
| `dos:shutdown:complete` | Shutdown finalizado |

Integração futura: bridge `IEventPublisher` → Corporate Event Bus.

## Escalabilidade

### 1. Substituição de backends

| Componente | Default | Produção |
|------------|---------|----------|
| `IModuleRegistry` | InMemory | Adapter Core |
| `IPluginRegistry` | InMemory | Adapter PluginManager |
| `IEventPublisher` | InMemory | Event Bus bridge |
| `IHealthMonitor` | Status-based | Metrics + probes |

### 2. Boot assíncrono (futuro)

`IBootManager.boot()` pode evoluir para `bootAsync()` com fases paralelas onde dependências permitem.

### 3. Hot-reload de plugins (futuro)

`pluginRegistry.register()` incremental após boot inicial — DOS já separa validação de carregamento.

### 4. Multi-ambiente

`VersionManager.setEnvironment()` + `KernelOptions.environment` — boot configurável por ambiente.

### 5. Observabilidade

`Diagnostics` + `IEventPublisher.getHistory()` — base para dashboard operacional e alertas.

## Integração futura (fora desta sprint)

1. `DOSProvider` como root do `AppShell` (acima de `CoreProvider`)
2. Adapter `CoreModuleRegistry` → `IModuleRegistry`
3. Adapter `PluginManager` → `IPluginRegistry`
4. Bridge `dos:platform:ready` → carregar domain providers
5. Bridge eventos DOS → Corporate Event Bus
6. Rota `/system` com `DOSStatusPanel`
7. Health endpoint HTTP a partir de `getHealthReport()`

## Uso arquitetural (referência)

```tsx
import { DOSProvider, DOSStatusPanel } from "@douglas/dos";
import { dosBootOptions } from "@/features/dos";

function SystemPage() {
  return (
    <DOSProvider bootOptions={dosBootOptions}>
      <DOSStatusPanel />
    </DOSProvider>
  );
}
```

Não conectado ao app nesta sprint.

## Relação com sprints anteriores

| Sprint | Pacote | Papel no DOS |
|--------|--------|--------------|
| 3.5 | `@douglas/core` | Módulos internos — adapter futuro |
| 3.6 | `@douglas/events` | Event publisher bridge futuro |
| 3.7 | `@douglas/notifications` | Módulo `notifications` no boot |
| 3.8 | `@douglas/analytics` | Módulo `analytics` no boot |
| 3.9 | `@douglas/plugins` | Manifests validados no boot |
| 4.0 | `@douglas/dos` | **Orquestrador central** |

## Testabilidade

Interfaces permitem mocks isolados:

```ts
const mockRegistry: IModuleRegistry = {
  register: vi.fn(),
  registerMany: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(() => []),
  has: vi.fn(),
  updateStatus: vi.fn(),
  size: vi.fn(() => 0),
  clear: vi.fn(),
};

const os = createOperatingSystem({ moduleRegistry: mockRegistry });
```

Cada subsistema testável sem Kernel completo.
