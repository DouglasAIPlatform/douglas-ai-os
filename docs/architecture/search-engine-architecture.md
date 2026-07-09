# Search Engine Architecture — Douglas AI Platform

> Status: Foundation v0.1  
> Sprint: 2.9  
> Escopo: infraestrutura interna de busca em `apps/headquarters`.

## Objetivo

O Search Engine interno deve fornecer uma base evolutiva para pesquisar:

- projetos;
- departamentos;
- agentes;
- configurações;
- usuários;
- documentação.

Nesta sprint não há banco de dados, Supabase, autenticação, permissões ou ranking semântico. A entrega é a arquitetura local usando mocks.

## Camadas

### SearchIndex

Arquivo:

`apps/headquarters/features/search-engine/SearchIndex.ts`

Responsabilidade:

- transformar rotas e mocks em documentos pesquisáveis;
- centralizar metadados de índice;
- preparar uma fronteira clara para troca futura por Supabase.

Hoje o índice usa:

- `appRoutes`;
- `projects`;
- `departments`;
- `agents`;
- registros mockados de usuários, configurações e documentação.

### SearchEngine

Arquivo:

`apps/headquarters/features/search-engine/SearchEngine.ts`

Responsabilidade:

- normalizar query;
- remover acentos;
- calcular score;
- ordenar resultados;
- aplicar limite e score mínimo.

Ele não depende de React. Isso permite testá-lo isoladamente ou substituí-lo por uma implementação remota no futuro.

### SearchProvider e SearchContext

Arquivos:

- `SearchProvider.tsx`
- `SearchContext.ts`
- `useSearch.ts`

Responsabilidade:

- armazenar query;
- expor resultados;
- armazenar pesquisas recentes em memória;
- disponibilizar ações para componentes client-side.

### Componentes

Arquivos:

- `SearchInput.tsx`
- `SearchResults.tsx`
- `RecentSearches.tsx`
- `SearchPanel.tsx`

Responsabilidade:

- renderizar UI de busca;
- consumir `useSearch`;
- não conhecer detalhes do algoritmo.

## Integração

`AppShell` envolve a aplicação com:

```tsx
<SearchProvider>
  <CommandPaletteProvider>
    <SidebarLayout />
    <CommandPaletteRoot />
  </CommandPaletteProvider>
</SearchProvider>
```

A rota `/brain` renderiza `SearchRoutePage`, que usa:

- `DashboardLayout`;
- `PageHeader`;
- `SearchPanel`.

## Contrato de Documento

Cada documento pesquisável segue:

```ts
{
  id: "project:calma",
  type: "project",
  title: "Calma",
  description: "Plataforma de bem-estar e mindfulness",
  href: "/projects",
  keywords: ["Calma", "project", "projeto"],
  metadata: {
    status: "Em Desenvolvimento"
  }
}
```

## Preparação para Supabase

A integração futura com Supabase deve substituir ou complementar `SearchIndex`.

Opções planejadas:

1. **Postgres full-text search**
   - Tabela/index materializado de documentos pesquisáveis.
   - `tsvector` com pesos por `title`, `description`, `keywords`.

2. **pgvector / embeddings**
   - Busca semântica para documentos, agentes e projetos.
   - Útil para perguntas naturais e integração com IA.

3. **Edge Function**
   - Camada segura para ranking híbrido.
   - Evita expor regras sensíveis no client.

4. **RLS**
   - Quando houver dados reais, resultados precisam respeitar permissões.
   - Toda tabela exposta deve usar RLS.

Esta sprint não cria tabelas, migrations, clients Supabase, policies ou chamadas remotas.

## Decisões Arquiteturais

### Engine independente de React

`SearchEngine` é uma classe sem hooks. Isso mantém a lógica testável e substituível.

### Índice local explícito

`SearchIndex` torna visível quais fontes alimentam a busca. Isso facilita migrar para Supabase sem reescrever UI.

### Provider em memória

Pesquisas recentes ficam em memória por enquanto. Persistência exigiria decisões sobre usuário, privacidade e storage.

### Integração em `/brain`

O Search Engine aparece no Brain porque Brain representa conhecimento e inteligência operacional. Ainda assim, o provider é global, permitindo uso futuro no Command Palette ou em qualquer rota.

## Evoluções Futuras

- conectar Supabase com RLS;
- adicionar ranking por uso;
- persistir pesquisas recentes por usuário;
- integrar Command Palette ao SearchEngine;
- adicionar busca semântica;
- criar API interna de busca;
- adicionar filtros por tipo;
- adicionar analytics de busca;
- adicionar testes unitários para `SearchEngine`.
