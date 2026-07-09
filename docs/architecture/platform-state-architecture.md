# Platform State Architecture — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.5  
> Escopo: fachada unificada + DOS live integration.

## Objetivo

Unificar a observabilidade da Douglas AI OS em uma **única fachada de estado** (`Platform State`), agregando Bootstrap, Runtime, Health, Dependency Graph, Event Monitor e DOS.

## Problema resolvido

Antes da Sprint 5.5, existiam **6 estados paralelos**:

| Fonte | Onde vivia |
|-------|------------|
| Bootstrap State | `@douglas/bootstrap` |
| Runtime State | `@douglas/runtime` |
| Health Report | `@douglas/health` |
| Dependency Graph | `@douglas/graph` (mock estático no widget) |
| Event Monitor | `@douglas/monitor` |
| DOS State | `@douglas/dos` (sem provider no AppShell) |

`PlatformStateFacade` consolida tudo em um `PlatformSnapshot` único.

## Pacote `@douglas/platform-state`

```
packages/platform-state/src/
├── PlatformStateTypes.ts      # Snapshot, summary, readiness, inputs
├── PlatformStateFacade.ts     # Agregação pura (sem React, sem @douglas/*)
├── PlatformStateContext.ts
├── PlatformStateProvider.tsx
└── usePlatformState.ts
```

## DOS Live Integration

**Decisão:** `DOSProvider` existia em `@douglas/dos` mas não estava wired no AppShell.

### Alterações

1. **`DOSProvider` adicionado ao AppShell** — após `CoreProvider`, antes de `EventProvider`.
2. **Boot duplicado removido** — módulo `dos` no bootstrap deixa de chamar `createOperatingSystem().boot()`; delega ao `DOSProvider`.
3. **Health check DOS** — usa dados reais de `useDOS()` quando disponível.
4. **Platform State** — layer `dos` lê `dos.state`, `dos.isReady`, `dos.health`.

### Provider tree (atual)

```
BootstrapProvider
└── CoreProvider
    └── DOSProvider              ← Sprint 5.5 (boot único)
        └── EventProvider
            └── EventMonitorIntegration
                └── RuntimeIntegration
                    └── RuntimeProvider
                        └── HealthIntegration
                            └── HealthProvider
                                └── PlatformStateIntegration  ← Sprint 5.5
                                    └── (domínios)
```

## PlatformSnapshot

```ts
interface PlatformSnapshot {
  generatedAt: string;
  platformVersion: string;
  summary: PlatformStatusSummary;    // overall, loaded, ready, alert, critical
  readiness: PlatformReadiness;      // level, score, blockers
  modules: PlatformModuleSnapshot[];   // visão unificada por módulo
  layers: { bootstrap, runtime, health, dependencyGraph, eventMonitor, dos };
}
```

## Agregação de módulos

`PlatformStateFacade` faz merge por `id` a partir de:

- Bootstrap modules (catálogo primário)
- Runtime modules
- Health modules
- DOS (módulo `dos` enriquecido)

Status overall por módulo: `ready | alert | critical | offline | unknown`.

## Dependency Graph live

`buildLiveDependencyGraphInput()` atualiza status de nós/arestas a partir de bootstrap + runtime reais (base topológica em seeds).

## Fallbacks documentados

| Camada | Fallback |
|--------|----------|
| DOS | `"Fallback: indisponível"` se input null (não ocorre com provider wired) |
| Health | null até bootstrap + runtime prontos |
| Event Monitor | ticker mock 8s continua (eventos internos demo) |
| Seeds monitor | 12 eventos iniciais mock (complementam bus real) |

## Headquarters

`UnifiedPlatformStatusWidget` — visão unificada no topo de `/headquarters`. Widgets anteriores **preservados**.

## Inversão de dependência

`@douglas/platform-state` **não importa** outros pacotes `@douglas/*`. Integração em `features/platform-state/PlatformStateIntegration.tsx`.

## Próximos passos

1. **Ações no Command Center** — pause/restart via RuntimeManager a partir do snapshot.
2. **Sync DependencyGraphWidget** — consumir `usePlatformState()` em vez de mock estático.
3. **Remover mock ticker** do Event Monitor quando volume real de eventos for suficiente.
4. **Persistência de snapshots** — histórico para Analytics (opcional).
5. **Platform CLI** — `pnpm platform:status` lendo facade.

## Testabilidade

```ts
const facade = createPlatformStateFacade();
const snapshot = facade.build({
  platformVersion: "0.1.0",
  bootstrap: { /* ... */ },
  runtime: null,
  health: null,
  dependencyGraph: null,
  eventMonitor: null,
  dos: null,
});
expect(snapshot.summary.overall).toBeDefined();
```
