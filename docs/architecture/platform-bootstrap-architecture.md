# Platform Bootstrap Architecture — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.0  
> Escopo: bootstrap oficial em `packages/bootstrap/` + integração Headquarters.

## Objetivo

Criar o **Bootstrap oficial** da Douglas AI Platform — responsável por inicializar todos os módulos existentes, expor **PlatformState global** e reportar saúde via **StartupReport**.

Sprint 5.0 é a **primeira integração real** no Headquarters via `BootstrapProvider` e `SystemStatusWidget`. Sem banco, sem IA externa, mocks onde necessário.

## Pacote

```
packages/bootstrap/src/
├── BootstrapTypes.ts           # PlatformState, StartupReport, module results
├── interfaces/
│   ├── IBootstrapModuleLoader.ts
│   └── IBootstrapManager.ts
├── ModuleLoader.ts             # Topological load + timing
├── PlatformState.ts            # Estado global da plataforma
├── SystemHealth.ts             # Agregação de health
├── StartupReport.ts            # Relatório de boot
├── BootstrapManager.ts         # Orquestrador
├── PlatformBootstrap.ts        # Ponto de entrada
├── BootstrapProvider.tsx       # React integration
└── usePlatformBootstrap.ts
```

## Integração Headquarters

```
AppShell
└── BootstrapProvider          ← Sprint 5.0 (outermost)
    └── CoreProvider           ← existente
        └── EventProvider
            └── ... (demais providers)
                └── HeadquartersPage
                    └── SystemStatusWidget
```

```
apps/headquarters/features/platform-bootstrap/
├── modules.ts    # 11 módulos + boot functions
└── index.ts
```

## Módulos inicializados

| ID | Nome | Dependências |
|----|------|--------------|
| `core` | Douglas Core | — |
| `dos` | Douglas Operating System | core |
| `brain` | Douglas Brain | core |
| `plugins` | Plugin System | dos |
| `agents` | Agent Framework | core |
| `workflow` | Workflow Engine | agents |
| `automation` | Automation Engine | workflow |
| `departments` | Department Manager | core |
| `missions` | Mission Control | departments |
| `analytics` | Analytics Engine | workflow, automation |
| `notifications` | Notification Center | core |

## Fluxo de inicialização

```
1. BootstrapProvider monta (AppShell)
         │
         ▼
2. PlatformBootstrap.boot({ platformVersion, modules })
         │
         ▼
3. BootstrapManager.boot()
         │
         ├── PlatformState.beginBoot()
         │
         ├── ModuleLoader.loadAll()
         │        │
         │        ├── resolveLoadOrder()  ← topological sort
         │        │
         │        └── para cada módulo:
         │               ├── module.load()
         │               ├── medir initTimeMs
         │               └── PlatformState.applyModuleResult()
         │
         ├── SystemHealth.evaluate()
         │
         ├── PlatformState.completeBoot()
         │
         └── StartupReportBuilder.build()
         │
         ▼
4. usePlatformBootstrap() → SystemStatusWidget renderiza
```

## Ciclo de vida

```
offline → booting → ready | degraded | failed
```

### Por módulo

```
pending → loading → ready | degraded | failed
```

Cada módulo informa via `BootstrapModuleResult`:

```ts
interface BootstrapModuleResult {
  id: string;
  name: string;
  version: string;
  status: BootstrapModuleStatus;
  initTimeMs: number;
  health: BootstrapHealthStatus;
  message?: string;
}
```

## PlatformState global

```ts
interface GlobalPlatformState {
  status: PlatformBootStatus;
  platformVersion: string;
  bootStartedAt?: string;
  bootCompletedAt?: string;
  bootDurationMs: number;
  modules: BootstrapModuleSnapshot[];
  health: BootstrapHealthStatus;
  readyModuleCount: number;
  totalModuleCount: number;
}
```

Acessível via:

```ts
const { state, health, startupReport, isBooting, isReady } = usePlatformBootstrap();
```

## SystemHealth

Agrega health de todos os módulos:

| Condição | Health global |
|----------|---------------|
| Algum módulo `unhealthy` | unhealthy |
| Algum `degraded` ou status degraded | degraded |
| Algum `failed` | unhealthy |
| Todos healthy | healthy |

## StartupReport

Relatório completo pós-boot:

```ts
interface StartupReport {
  success: boolean;
  platformVersion: string;
  bootDurationMs: number;
  moduleCount: number;
  readyCount: number;
  degradedCount: number;
  failedCount: number;
  modules: BootstrapModuleResult[];
  health: SystemHealthReport;
  generatedAt: string;
}
```

## SystemStatusWidget

Widget no Headquarters (`/headquarters`) que consome `PlatformState`:

- Módulos carregados (tabela)
- Status por módulo
- Versão
- Tempo de init (ms)
- Health
- Tempo total de boot
- Versão da plataforma

## Como um novo módulo participa do Boot

### Passo 1 — Definir boot function

Em `apps/headquarters/features/platform-bootstrap/modules.ts`:

```ts
{
  id: "my-module",
  name: "My Module",
  version: "0.1.0",
  dependencies: ["core"],  // opcional
  load: () =>
    measure("my-module", "My Module", "0.1.0", () => {
      // inicialização mock ou real
      const manager = new MyModuleManager();
      manager.initialize();
      return {
        status: "ready",
        health: "healthy",
        message: "Module ready",
      };
    }),
}
```

### Passo 2 — Adicionar ao array

Incluir em `platformBootstrapModules` respeitando DAG de dependências.

### Passo 3 — (Opcional) Provider React

Se o módulo tem Provider, mantê-lo no `AppShell` como hoje. O Bootstrap **reporta** o boot; providers **executam** runtime React.

### Contrato `BootstrapModuleDefinition`

```ts
interface BootstrapModuleDefinition {
  id: string;
  name: string;
  version: string;
  dependencies?: string[];
  load: () => BootstrapModuleResult | Promise<BootstrapModuleResult>;
}
```

## Evolução futura

### 1. Boot assíncrono paralelo

Módulos sem dependências compartilhadas podem carregar em paralelo:

```ts
// ModuleLoader futuro
const batches = groupByDependencyLevel(modules);
for (const batch of batches) {
  await Promise.all(batch.map(loadModule));
}
```

### 2. IMissionExecutor / health probes reais

Substituir mocks por chamadas reais:

```ts
load: async () => {
  const engine = getCoreEngine();
  const report = engine.getHealthReport();
  return mapHealthReport(report);
}
```

### 3. Retry e circuit breaker

```ts
interface BootstrapModuleDefinition {
  retries?: number;
  timeoutMs?: number;
}
```

### 4. Boot phases

Estender para fases como DOS: `validating → loading → health_check → ready`.

### 5. Persistent StartupReport

Enviar report para Analytics Engine após boot.

### 6. Hot reload de módulos

`BootstrapManager.reloadModule(id)` sem reboot completo.

### 7. CLI boot

```bash
pnpm platform:boot --env production
```

## Inversão de dependência

`@douglas/bootstrap` **não importa** outros pacotes `@douglas/*`. Definições de módulos ficam na camada app (`features/platform-bootstrap/`).

| Camada | Responsabilidade |
|--------|------------------|
| `@douglas/bootstrap` | Orquestração, timing, state, health |
| `features/platform-bootstrap/` | Definições e boot functions |
| Pacotes de domínio | Lógica dos módulos (inalterados) |
| `AppShell` | Providers React existentes |

## Preservação da arquitetura

Sprint 5.0 **não modifica** pacotes de domínio existentes. Apenas:

- Adiciona `@douglas/bootstrap`
- Envolve `AppShell` com `BootstrapProvider`
- Atualiza página `/headquarters` com widget

Todos os providers anteriores permanecem na mesma ordem e contrato.

## Relação com DOS (Sprint 4.0)

| Camada | Papel |
|--------|-------|
| **Platform Bootstrap** | Boot de TODA a plataforma (11 módulos) |
| **DOS** | Boot interno de módulos OS (9 core modules + plugins) |

DOS é bootstrapped como um módulo dentro do Platform Bootstrap. Composição, não substituição.

## Testabilidade

```ts
const bootstrap = createPlatformBootstrap();
const report = await bootstrap.boot({
  platformVersion: "0.1.0",
  modules: [mockModule],
});

expect(report.success).toBe(true);
expect(bootstrap.getState().status).toBe("ready");
```
