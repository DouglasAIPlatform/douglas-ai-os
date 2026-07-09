# Routing Architecture — Douglas AI Platform

> Status: Foundation v0.1  
> Escopo: aplicação `apps/headquarters` e padrão futuro para apps como Calma, YouTube Studio, CRM, Analytics e Brain.

## Objetivo

A arquitetura de rotas da Douglas AI Platform deve permitir centenas de páginas sem espalhar paths, labels, breadcrumbs e navegação pela codebase.

Toda rota navegável deve nascer em um registro central e ser consumida por:

- App Router do Next.js
- Sidebar
- breadcrumbs
- placeholders de página
- futuras ferramentas de busca, command palette e analytics

## Fonte de Verdade

Arquivo oficial:

`apps/headquarters/config/routes.tsx`

Esse arquivo contém:

- `AppRouteId`
- `AppRouteDefinition`
- `appRoutes`
- `routeById`
- `sidebarNavigationSections`
- `getRouteById`
- `getRouteBreadcrumbs`
- `getActiveSidebarHref`

## Decisão Arquitetural

As rotas foram centralizadas fora da Sidebar e fora das páginas.

Motivo:

- A Sidebar não deve conhecer paths hardcoded.
- Páginas não devem repetir breadcrumbs e metadados.
- Futuras features, como Command Palette e Pesquisa Global, poderão usar o mesmo registro.
- IDs estáveis (`AppRouteId`) permitem refactors de URL sem quebrar componentes consumidores.

## Padrão de Rota

Cada rota possui:

```ts
{
  id: "projects",
  label: "Projetos",
  path: "/projects",
  title: "Projetos",
  subtitle: "Portfólio de produtos, iniciativas e entregas estratégicas.",
  section: "workspace",
  icon: <NavigationIcon />,
  keywords: ["products", "portfolio", "roadmap"],
  order: 20,
}
```

## Sidebar

A Sidebar consome apenas:

```ts
sidebarNavigationSections
```

O estado ativo é calculado por:

```ts
getActiveSidebarHref(pathname)
```

Isso prepara nested routes futuras, como:

- `/projects/calma`
- `/agents/atlas`
- `/analytics/revenue`

Nesses casos, a Sidebar pode manter o item pai ativo.

## Páginas Vazias

Todas as páginas iniciais da Sprint 2.7 usam:

`apps/headquarters/components/routing/EmptyRoutePage.tsx`

Esse componente recebe apenas `routeId`:

```tsx
<EmptyRoutePage routeId="projects" />
```

Ele resolve metadados, breadcrumbs e estrutura pelo registro central.

## Layout

Toda página usa `DashboardLayout` indiretamente via `EmptyRoutePage`.

Isso garante que nenhuma página repita:

- background
- container
- page header
- footer
- estrutura base

## Rotas Criadas

| Path | Route ID | Status |
|---|---|---|
| `/headquarters` | `headquarters` | Placeholder |
| `/projects` | `projects` | Placeholder |
| `/agents` | `agents` | Placeholder |
| `/brain` | `brain` | Placeholder |
| `/analytics` | `analytics` | Placeholder |
| `/settings` | `settings` | Placeholder |
| `/profile` | `profile` | Placeholder |

`/` redireciona para `/headquarters`.

## Como Adicionar Nova Página

1. Adicionar uma entrada em `appRoutes`.
2. Criar a pasta no App Router.
3. Renderizar `EmptyRoutePage` ou uma página específica que use `DashboardLayout`.

Exemplo:

```tsx
import { EmptyRoutePage } from "@/components/routing/EmptyRoutePage";

export default function NewPage() {
  return <EmptyRoutePage routeId="new-route" />;
}
```

## Trade-offs

### Registro em TSX

Os ícones vivem no registro, por isso o arquivo é `.tsx`.

Benefício:

- Sidebar recebe objetos prontos.
- Não há lookup paralelo de ícones.

Custo:

- O registro é específico da aplicação visual, não deve ser usado diretamente em backend.

### Placeholders Centralizados

As páginas vazias usam um único `EmptyRoutePage`.

Benefício:

- Sem duplicação de estrutura.
- Todas herdam breadcrumbs e layout automaticamente.

Custo:

- Quando uma página ganhar conteúdo real, ela precisará substituir o placeholder mantendo o `DashboardLayout`.

## Próximas Evoluções

- Rotas aninhadas por domínio.
- `routeGroups` para apps futuras.
- Permissões por rota quando autenticação existir.
- Command Palette consumindo `appRoutes`.
- Pesquisa global usando `keywords`.
- Analytics de navegação por `route.id`.
