# Plugin System Architecture — Douglas AI Platform

> Status: Foundation v0.1  
> Sprint: 3.9  
> Escopo: sistema de plugins em `packages/plugins/`.

## Objetivo

Permitir adicionar **novos produtos** à Douglas AI Platform **sem alterar o Core**. Cada produto (Calma, YouTube Studio, CRM, futuras apps) registra-se como um Plugin declarando rotas, menus, widgets, agentes, eventos e permissões.

Nesta sprint **não há integração** com AppShell, roteamento Next.js, Event Bus ou Agent Framework. A entrega é arquitetura pura — contratos, registro e carregamento ordenado.

## Pacote

```
packages/plugins/src/
├── PluginTypes.ts           # IDs, status, definições de registro
├── PluginManifest.ts        # Schema declarativo + validação
├── Plugin.ts                # Entidade Plugin + factory
├── PluginRegistry.ts        # Armazena plugins e extensões
├── PluginContext.ts         # API de registro por plugin
├── PluginLoader.ts          # Carregamento ordenado por deps
├── PluginManager.ts         # Orquestrador de alto nível
├── PluginSystemContext.ts   # Contexto React
├── PluginProvider.tsx
├── usePlugins.ts
├── PluginCatalogPanel.tsx   # UI de catálogo (mock)
└── index.ts
```

## Seeds (app)

```
apps/headquarters/features/plugins/
├── manifests.ts    # Calma, YouTube Studio, CRM
└── index.ts
```

Sem wiring no `AppShell` nesta sprint.

## Relação com Douglas Core

| Camada | Pacote | Escopo |
|--------|--------|--------|
| **Core Modules** | `@douglas/core` | Capacidades internas da plataforma (brain, agents, workflow…) |
| **Plugins** | `@douglas/plugins` | Produtos externos conectáveis sem tocar no Core |

O Plugin System **não importa** `@douglas/core`. Integração futura: Core emite `core:platform:ready` → PluginManager carrega plugins registrados.

## Componentes

### PluginManifest

Contrato declarativo de tudo que um produto oferece:

```ts
interface PluginManifest {
  id: PluginId;
  name: string;
  description: string;
  version: string;
  packageName?: string;
  dependencies?: PluginId[];
  routes?: PluginRouteDefinition[];
  menus?: PluginMenuDefinition[];
  widgets?: PluginWidgetDefinition[];
  agents?: PluginAgentDefinition[];
  events?: PluginEventDefinition[];
  permissions?: PluginPermissionDefinition[];
  metadata?: PluginMetadata;
}
```

### Plugin

Entidade runtime com status (`registered` → `loading` → `loaded` → `ready`).

```ts
const myProduct = createPlugin(manifest, (context) => {
  // registro programático opcional
  context.registerWidget({ id: "...", name: "...", slot: "dashboard" });
});
```

### PluginRegistry

Armazena plugins e **todas as extensões registradas**, indexadas por `pluginId`:

- `registerRoute`, `registerMenu`, `registerWidget`
- `registerAgent`, `registerEvent`, `registerPermission`
- Queries: `getRoutes()`, `getMenus()`, `getWidgets(slot)`, etc.

### PluginContext

Contexto passado a cada plugin durante o carregamento. Métodos de registro delegam ao registry:

```ts
class PluginContext {
  registerRoute(route: PluginRouteDefinition): void;
  registerMenu(menu: PluginMenuDefinition): void;
  registerWidget(widget: PluginWidgetDefinition): void;
  registerAgent(agent: PluginAgentDefinition): void;
  registerEvent(event: PluginEventDefinition): void;
  registerPermission(permission: PluginPermissionDefinition): void;
  registerFromManifest(): void;  // registra arrays do manifest
}
```

### PluginLoader

- Resolve ordem de carregamento por `dependencies` (topological sort)
- Cria `PluginContext` por plugin
- Chama `registerFromManifest()` + hook `setup` opcional
- Atualiza status no registry

### PluginManager

Facade de alto nível:

```ts
const manager = new PluginManager();
manager.register([calmaPlugin, youtubeStudioPlugin, crmPlugin]);

manager.getRoutes();       // todas as rotas de todos os plugins
manager.getMenus();        // menus agregados
manager.getWidgets("dashboard"); // widgets por slot
manager.getAgents();
manager.getEvents();
manager.getPermissions();
```

## O que cada plugin registra

| Extensão | Propósito | Consumidor futuro |
|----------|-----------|-------------------|
| **Rotas** | Paths e metadados de navegação | Next.js router, command palette |
| **Menus** | Entradas de sidebar/header | AppShell navigation |
| **Widgets** | Blocos em slots (`dashboard`, `sidebar`…) | Dashboard composable |
| **Agentes** | Agentes específicos do produto | `@douglas/agents` registry |
| **Eventos** | Topics publicados/assinados | `@douglas/events` corporate bus |
| **Permissões** | ACL do produto | Auth module, RBAC |

Nenhum consumidor está conectado nesta sprint — apenas registro e consulta.

## Produtos preparados

| Plugin ID | Produto | Rotas | Agentes |
|-----------|---------|-------|---------|
| `calma` | Calma | `/calma`, `/calma/sessions` | Calma Guide |
| `youtube-studio` | YouTube Studio | `/youtube`, `/youtube/upload` | YouTube Producer |
| `crm` | CRM | `/crm`, `/crm/contacts` | CRM Closer |

## Como conectar um novo produto

Um novo produto entra na plataforma **apenas registrando um Plugin** — sem editar Core, AppShell ou módulos existentes.

### Passo 1 — Criar o pacote do produto

```
packages/my-product/
├── package.json          # name: "@douglas/my-product"
└── src/
    └── index.ts          # exporta manifest + pages (futuro)
```

### Passo 2 — Definir o manifest

```ts
import { createPlugin, createPluginManifest } from "@douglas/plugins";

export const myProductPlugin = createPlugin(
  createPluginManifest({
    id: "my-product",
    name: "Meu Produto",
    description: "Descrição do produto.",
    version: "1.0.0",
    packageName: "@douglas/my-product",
    routes: [
      {
        id: "my-product-home",
        path: "/my-product",
        title: "Meu Produto",
        label: "Meu Produto",
        componentId: "my-product:HomePage",
      },
    ],
    menus: [
      {
        id: "menu:my-product",
        label: "Meu Produto",
        section: "products",
        routeId: "my-product-home",
      },
    ],
    widgets: [
      {
        id: "widget:my-product-summary",
        name: "Resumo",
        slot: "dashboard",
        componentId: "my-product:SummaryWidget",
      },
    ],
    agents: [
      {
        id: "agent:my-product-assistant",
        name: "Assistant",
        description: "Agente do produto.",
        capabilities: ["analysis"],
        permissions: ["read:my-product"],
      },
    ],
    events: [
      {
        topic: "my-product:action:completed",
        description: "Ação concluída.",
        publishers: ["my-product"],
        subscribers: ["analytics", "notifications"],
      },
    ],
    permissions: [
      {
        id: "read:my-product",
        label: "Ler produto",
        description: "Acesso de leitura.",
        scope: "read",
      },
    ],
  }),
);
```

### Passo 3 — Registrar na plataforma

```ts
import { PluginManager } from "@douglas/plugins";
import { myProductPlugin } from "@douglas/my-product";

const manager = new PluginManager();
manager.register([...existingPlugins, myProductPlugin]);
```

Ou via React:

```tsx
<PluginProvider plugins={[...productPlugins, myProductPlugin]}>
  {children}
</PluginProvider>
```

### Passo 4 — Integração futura (automática)

Quando conectado ao AppShell, os consumidores leem do manager:

```
PluginManager.getMenus()  → AppShell merge na sidebar
PluginManager.getRoutes() → Next.js dynamic routes
PluginManager.getEvents() → EventRegistry merge
PluginManager.getAgents() → AgentRegistry merge
PluginManager.getPermissions() → Auth RBAC
PluginManager.getWidgets("dashboard") → Dashboard grid
```

**O Core permanece intocado.** O produto só precisa exportar um `Plugin` válido.

### Registro programático (opcional)

Para extensões dinâmicas, use o hook `setup`:

```ts
createPlugin(manifest, (context) => {
  if (process.env.FEATURE_FLAG === "true") {
    context.registerRoute({
      id: "beta-feature",
      path: "/my-product/beta",
      title: "Beta",
      label: "Beta",
    });
  }
});
```

## Fluxo de carregamento

```
PluginManifest[]
       │
       ▼
PluginManager.register()
       │
       ▼
PluginLoader.loadAll()
       │
       ├── resolveLoadOrder()  ← topological sort por dependencies
       │
       └── para cada plugin:
              ├── PluginRegistry.registerPlugin()
              ├── new PluginContext(pluginId, manifest, registry)
              ├── context.registerFromManifest()
              ├── plugin.setup?.(context)     ← opcional
              └── status → ready
```

## Escalabilidade

### 1. Zero alteração no Core

Novos produtos = novo manifest + `manager.register()`. Core modules permanecem estáveis.

### 2. Dependências entre produtos

```ts
dependencies: ["crm"]  // carrega CRM antes deste plugin
```

`PluginLoader.resolveLoadOrder()` garante ordem correta.

### 3. Registro declarativo vs programático

- **Declarativo** — arrays no manifest (CI-friendly, reviewable)
- **Programático** — hook `setup(context)` para lógica condicional

### 4. Isolamento de permissões

Cada plugin define `permissions` com namespace (`read:calma`, `write:crm:leads`). Auth module agrega sem colisão.

### 5. Eventos namespaced

Topics seguem padrão `{product}:{entity}:{action}` — merge seguro no Corporate Event Bus.

### 6. componentId vs implementação

Rotas e widgets referenciam `componentId` (string), não componentes React. Resolver futuro mapeia IDs → lazy imports do pacote do produto.

### 7. Multi-app monorepo

```
apps/headquarters/     ← PluginProvider agrega todos os plugins
apps/calma/            ← pode rodar standalone com só calmaPlugin
packages/calma/        ← manifest + pages
```

### 8. Hot-plug (futuro)

`PluginManager.register()` pode ser chamado em runtime quando um produto é instalado — registry suporta extensão incremental.

## Validação

```ts
import { validatePluginManifest } from "@douglas/plugins";

const errors = validatePluginManifest(manifest);
// ex.: menu referenciando routeId inexistente
```

## Integração futura (fora desta sprint)

1. `PluginProvider` no `AppShell` após `CoreProvider`
2. Merge de `getMenus()` na navigation config
3. Dynamic routes no Next.js a partir de `getRoutes()`
4. Bridge Event Bus ← `getEvents()`
5. Bridge Agent Registry ← `getAgents()`
6. Widget resolver no dashboard
7. RBAC middleware ← `getPermissions()`

## Uso arquitetural (referência)

```tsx
import { PluginProvider, PluginCatalogPanel } from "@douglas/plugins";
import { productPlugins } from "@/features/plugins";

function PluginsPage() {
  return (
    <PluginProvider plugins={productPlugins}>
      <PluginCatalogPanel />
    </PluginProvider>
  );
}
```

Não conectado ao app nesta sprint — apenas contrato documentado.

## Testabilidade

```ts
const manager = new PluginManager();
manager.register([calmaPlugin]);

expect(manager.getRoutes()).toHaveLength(2);
expect(manager.getAgents("calma")).toHaveLength(1);
expect(manager.getReadyPlugins()).toHaveLength(1);
```

Cada plugin pode ser testado isoladamente sem Core ou AppShell.
