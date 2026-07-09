# Dependency Graph Architecture — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.3  
> Escopo: dependency graph em `packages/graph/` + widget Headquarters.

## Objetivo

Criar o **Dependency Graph** da Douglas AI OS — responsável por **mapear e validar** dependências entre módulos da plataforma, complementando Bootstrap (5.0), Runtime (5.1) e Health Engine (5.2).

Sprint 5.3 usa **dados mockados** no widget, sem bibliotecas de visualização gráfica.

## Pacote

```
packages/graph/src/
├── GraphTypes.ts                  # Nodes, edges, issues, report
├── DependencyMap.ts                 # Armazenamento do grafo
├── DependencyNode.ts                # DependencyNodeRegistry
├── DependencyEdge.ts                # DependencyEdgeRegistry
├── CircularDependencyDetector.ts    # Detecção de ciclos (DFS)
├── DependencyResolver.ts            # Ordem de carga topológica
├── DependencyValidator.ts           # Validações (via DependencyReport)
├── DependencyReport.ts              # DependencyValidator + Builder
└── DependencyGraph.ts               # Orquestrador
```

## Módulos mapeados (12)

| ID | Nome | Camada |
|----|------|--------|
| `core` | Douglas Core | platform |
| `dos` | Douglas Operating System | bootstrap |
| `runtime` | Platform Runtime | runtime |
| `brain` | Douglas Brain | platform |
| `agents` | Agent Framework | platform |
| `missions` | Mission Control | platform |
| `workflow` | Workflow Engine | platform |
| `automation` | Automation Engine | platform |
| `analytics` | Analytics Engine | platform |
| `notifications` | Notification Center | platform |
| `plugins` | Plugin System | platform |
| `health` | Health Engine | observability |

## Modelo de dependência

Direção da aresta: **source → target** significa *source depende de target*.

```ts
interface DependencyEdge {
  id: string;
  source: string;       // módulo dependente
  target: string;       // módulo requerido
  type: DependencyType;
  required: boolean;
  status: DependencyEdgeStatus;
  description: string;
  metadata: Record<string, string | number | boolean>;
}
```

Tipos: `bootstrap` | `runtime` | `health` | `data` | `event` | `infrastructure`

Status: `healthy` | `warning` | `critical` | `missing` | `unavailable`

## Como o grafo funciona

```
1. DependencyMap.load(nodes, edges)
         │
         ▼
2. DependencyGraph.analyze()
         │
         ├── CircularDependencyDetector.detect()
         ├── DependencyValidator.validate()
         │        ├── missing dependencies
         │        ├── circular dependencies
         │        ├── orphan modules
         │        └── critical unavailable
         │
         ├── DependencyResolver.resolveLoadOrder()
         └── DependencyReport gerado
         │
         ▼
3. DependencyGraphWidget exibe report
```

## Validações

| Tipo | Severidade | Condição |
|------|------------|----------|
| `missing_dependency` | critical | source ou target não existe no grafo |
| `circular_dependency` | critical | ciclo detectado via DFS |
| `orphan_module` | warning | módulo sem arestas entrando ou saindo |
| `critical_unavailable` | critical | dependência `required` indisponível |

## Como registrar dependências

Em `apps/headquarters/features/platform-graph/seeds.ts`:

```ts
import { DependencyEdgeRegistry, DependencyNodeRegistry } from "@douglas/graph";

// Nó
DependencyNodeRegistry.create({
  id: "my-module",
  name: "My Module",
  version: "0.1.0",
  status: "healthy",
  layer: "platform",
  metadata: {},
});

// Aresta — my-module depende de core
DependencyEdgeRegistry.create("my-module", "core", {
  type: "bootstrap",
  required: true,
  status: "healthy",
  description: "My module requires Core",
  metadata: {},
});
```

Exportar como `DependencyGraphInput` e passar para `createDependencyGraph()`.

## Como detectar problemas

```ts
const graph = createDependencyGraph(platformDependencyGraphInput);
const report = graph.getReport();

report.issues.forEach((issue) => {
  console.log(issue.type, issue.message);
});

const cycles = graph.detectCycles();
if (cycles.hasCycle) {
  console.log("Cycles:", cycles.cycles);
}
```

## Como isso ajuda o Douglas AI OS a se manter estável

| Benefício | Descrição |
|-----------|-----------|
| **Ordem de boot** | `loadOrder` garante que Core e DOS iniciem antes de dependentes |
| **Detecção precoce** | Ciclos e dependências ausentes são identificados antes do runtime |
| **Impacto de falhas** | Health Engine + Graph mostram quais módulos downstream são afetados |
| **Documentação viva** | Grafo reflete arquitetura real da plataforma |
| **Evolução segura** | Novos módulos são registrados com validação automática |

## Relação com sprints anteriores

```
Bootstrap  → carrega módulos (DAG interno)
Runtime    → mantém módulos vivos (sem deps diretas)
Health     → avalia saúde observando bootstrap/runtime
Graph      → documenta e valida relações entre módulos
```

O grafo **reutiliza** a topologia do bootstrap (`platform-bootstrap/modules.ts`) e expande com Runtime, Health Engine e camadas observability.

## DependencyGraphWidget

Widget em `/headquarters` (dados mockados):

- Total de módulos
- Total de dependências
- Dependências saudáveis
- Alertas (edges warning + issues warning)
- Possíveis problemas (lista de issues)
- Tabela de dependências
- Ordem de carga sugerida

Sem visualização gráfica — cards, lista e tabela apenas.

## Evolução futura

1. **Sync automático** — gerar grafo a partir de bootstrap modules + runtime state
2. **Visualização SVG** — diagrama interativo (sem libs externas ou com D3 opt-in)
3. **Integração Health** — atualizar edge status a partir de `HealthReport`
4. **Impact analysis** — "se Core falhar, quais módulos são afetados?"
5. **CLI** — `pnpm platform:graph validate`

## Inversão de dependência

`@douglas/graph` **não importa** pacotes `@douglas/*`. Seeds ficam na app.

## Testabilidade

```ts
const graph = createDependencyGraph({
  nodes: [/* ... */],
  edges: [/* circular edge for test */],
});

const report = graph.analyze();
expect(report.circularDependencyCount).toBeGreaterThan(0);
expect(report.status).toBe("critical");
```

## Preservação da arquitetura

Sprint 5.3 **não modifica** pacotes de domínio. Apenas:

- Adiciona `@douglas/graph`
- Adiciona seeds mockados em `features/platform-graph/`
- Adiciona `DependencyGraphWidget` no Headquarters

Todos os contratos anteriores permanecem intactos.
