# Memory Engine Architecture — Douglas AI Platform

> Status: Foundation v0.1  
> Sprint: 3.2  
> Escopo: engine oficial de memória em `packages/memory/`.

## Objetivo

Criar a infraestrutura oficial de memória da Douglas AI Platform, preparada para escala, múltiplos backends e integração futura com IA — sem implementar IA nesta sprint.

## Pacote

```
packages/memory/src/
├── MemoryTypes.ts          # Contratos centrais
├── MemoryRepository.ts     # Interface + InMemoryMemoryRepository
├── MemoryIndex.ts          # Índice por domain/tier/workspace
├── MemoryHistory.ts        # Audit trail de alterações
├── MemorySearch.ts         # Busca textual com scoring
├── MemoryStoreRegistry.ts  # Registro multi-provider
├── MemoryStore.ts          # Orquestrador principal
├── MemoryContext.ts        # Contexto React
├── MemoryProvider.tsx      # Provider global
├── useMemoryEngine.ts      # Hook de consumo
└── index.ts
```

## Tipos de Memória

| Conceito | Implementação | Descrição |
|----------|---------------|-----------|
| **Long Term Memory** | `tier: "long_term"` | Persistência conceitual de longo prazo |
| **Short Term Memory** | `tier: "short_term"` | Memória efêmera com `expiresAt` opcional |
| **Project Memory** | `domain: "project"` | Contexto por produto/iniciativa |
| **Agent Memory** | `domain: "agent"` | Contexto por agente |
| **Conversation Memory** | `domain: "conversation"` | Contexto de threads |
| **Platform Memory** | `domain: "platform"` | Fatos globais da plataforma |

`tier` define duração. `domain` define escopo semântico. Combinações são livres.

## Contrato de Registro

```ts
interface MemoryRecord {
  id: string;
  tier: MemoryTier;
  domain: MemoryDomain;
  kind: MemoryKind;
  content: string;
  workspaceId: string;
  sourceId?: string;
  agentId?: string;
  projectId?: string;
  conversationId?: string;
  tags: string[];
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  backendId: string;
}
```

## Camadas

### MemoryRepository

Interface de persistência. Implementação atual: `InMemoryMemoryRepository`.

Métodos: `write`, `read`, `update`, `delete`, `list`, `count`.

Futuro: `SupabaseMemoryRepository`, `VectorMemoryRepository` implementam a mesma interface.

### MemoryIndex

Índice em memória para lookup rápido:

- buckets por `domain`, `tier`, `workspaceId`;
- interseção de filtros;
- `snapshot()` com contagem por domínio e tier.

Rebuild automático após seed ou mutações via `MemoryStore`.

### MemoryHistory

Audit trail imutável:

- ações: `created`, `updated`, `deleted`;
- snapshot completo do registro no momento da ação;
- capacidade configurável (default 500 entradas).

Preparado para compliance e debugging de agentes.

### MemorySearch

Busca textual independente de React:

- normalização NFD + lowercase;
- scoring: exact +100, prefix +50, contains +20;
- campos: content, kind, domain, tier, tags.

Futuro: substituir ou complementar com busca semântica (pgvector).

### MemoryStoreRegistry — Multi-Provider

Núcleo da extensibilidade. Cada backend declara:

```ts
interface MemoryBackendProvider {
  id: string;
  name: string;
  source: "local" | "supabase" | "vector";
  tiers: MemoryTier[];
  domains: MemoryDomain[];
  priority: number;
}
```

Resolução de backend em writes:

1. `backendId` explícito no input;
2. match por `tier` + `domain`;
3. maior `priority` vence;
4. fallback para backend default.

Exemplo com dois backends locais:

| Backend | Tiers | Domains | Priority |
|---------|-------|---------|----------|
| `backend:local-core` | short + long | todos | 100 |
| `backend:local-short` | short only | conversation, agent | 200 |

Writes de `short_term` + `conversation` vão para `local-short` (priority 200).

### MemoryStore

Orquestrador que conecta registry, index, history e search:

- `write` / `read` / `update` / `delete`;
- `search(query)`;
- `getHistoryByRecord(id)`;
- `purgeExpired()` — remove short term expirados;
- `snapshot()` — estatísticas do índice.

### MemoryProvider + useMemoryEngine

Integração React. Configuração vem da aplicação:

```tsx
<MemoryProvider
  backends={memoryBackends}
  seedRecords={memorySeedRecords}
  defaultBackendId="backend:local-core"
>
```

Hook: `useMemoryEngine()` — evita conflito com `useMemory()` do Brain.

## Integração

`AppShell`:

```tsx
<SearchProvider>
  <MemoryProvider backends={...} seedRecords={...}>
    <AgentProvider>
      <BrainProvider>
        ...
      </BrainProvider>
    </AgentProvider>
  </MemoryProvider>
</SearchProvider>
```

Configuração da app em `features/memory-engine/`:

- `backends.ts` — declaração de providers;
- `seed.ts` — registros mock iniciais.

## Decisões Arquiteturais

### Pacote separado (`@douglas/memory`)

Reutilizável por todas as apps do monorepo. Brain, Agents e Headquarters consomem sem acoplar implementação.

### Repository Pattern

Persistência atrás de interface. Troca local → Supabase → vector sem alterar Store, Index ou UI.

### Registry multi-provider

Suporta cenários futuros:

- local para dev;
- Supabase para produção;
- pgvector para embeddings;
- providers por tenant ou produto.

Priority resolve conflitos quando múltiplos backends servem o mesmo tier/domain.

### Tier + Domain ortogonais

`long_term` + `agent` e `short_term` + `conversation` são combinações válidas. Evita enums rígidos que limitam centenas de agentes.

### History separado do Index

Index otimiza leitura. History otimiza auditoria. Responsabilidades distintas.

### Brain Memory vs Memory Engine

| Camada | Onde | Papel |
|--------|------|-------|
| Memory Engine | `@douglas/memory` | Store, search, multi-provider |
| Brain Memory | `features/brain/memory/` | Domínio cognitivo do Brain |
| Agent Memory | `@douglas/agents/AgentMemory` | Memória inline por agente |

Integração planejada: Brain e Agents delegarão ao Memory Engine.

## Preparação para IA (futuro)

- `MemorySearch` → busca semântica via embeddings;
- `backend:vector` com pgvector;
- consolidação automática short → long term;
- RAG: Knowledge + MemorySearch;
- purge e TTL para gestão de context window.

Nenhuma integração nesta sprint.

## Evolução Futura

- `SupabaseMemoryRepository` com RLS;
- `VectorMemoryRepository` com pgvector;
- sync Brain ↔ Memory Engine;
- Memory consolidation worker;
- UI de memória no Brain;
- testes unitários para Index, Search, Store.

## O que não foi implementado

- IA, embeddings, LLMs;
- Persistência remota;
- UI dedicada;
- Consolidação automática de memória;
- Mutations via API externa.
