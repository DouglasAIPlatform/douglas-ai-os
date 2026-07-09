# Command Palette Architecture — Douglas AI Platform

> Status: Foundation v0.1  
> Sprint: 2.8  
> Escopo: infraestrutura inicial do Douglas Command Palette.

## Objetivo

O Douglas Command Palette será a camada de acesso rápido da plataforma. Ele deve permitir, futuramente:

- pesquisar páginas;
- pesquisar agentes;
- pesquisar projetos;
- executar comandos;
- abrir módulos;
- acionar atalhos;
- integrar capacidades de IA.

Nesta sprint não há execução real de comandos, navegação programática ou IA. A entrega é infraestrutura.

## Inspiração

A referência conceitual vem de Raycast, Linear, Notion, Cursor e Command Palettes modernas: busca rápida, baixa fricção, teclado como fluxo principal e ações contextuais. A implementação preserva a identidade visual e os tokens da Douglas AI Platform.

## Camadas

### `packages/ui`

Arquivo:

`packages/ui/src/components/CommandPalette.tsx`

Responsabilidade:

- renderização visual;
- input;
- grupos;
- itens;
- estado vazio;
- footer;
- acessibilidade básica (`role="dialog"`, `aria-modal`, botões semânticos).

Essa camada não conhece Next.js, rotas, agentes, projetos, IA ou comandos reais.

### `apps/headquarters/features/command-palette`

Responsabilidade:

- provider;
- hooks;
- registry;
- filtro textual;
- integração com rotas, mocks e AppShell.

Arquivos:

- `types.ts`
- `registry.tsx`
- `search.ts`
- `CommandPaletteProvider.tsx`
- `CommandPaletteRoot.tsx`
- `CommandPaletteActions.tsx`
- `useCommandPalette.ts`
- `useCommandPaletteShortcuts.ts`

## Registro de Comandos

O registry é a fonte inicial para itens da palette:

`apps/headquarters/features/command-palette/registry.tsx`

Ele consome:

- `appRoutes` para páginas;
- `agents` mockados;
- `projects` mockados;
- comandos planejados.

Cada item possui:

```ts
{
  id: "page:projects",
  kind: "page",
  title: "Projetos",
  subtitle: "...",
  keywords: [],
  group: "pages",
  href: "/projects",
  shortcut: ["G", "P"],
  status: "available",
  aiReady: false
}
```

## Estados de Item

`available`: pronto para aparecer como item ativo.  
`planned`: preparado, mas ainda sem execução real.  
`disabled`: reservado para casos futuros de permissão/feature flag.

Nesta sprint, apenas páginas são tratadas como disponíveis; comandos, agentes e projetos estão preparados, mas não executam ação real.

## Provider

`CommandPaletteProvider` controla:

- abertura;
- fechamento;
- toggle;
- query;
- grupos filtrados;
- preview placeholder de item.

Não executa navegação, mutação ou chamadas externas.

## Hooks

`useCommandPalette`

Expõe o contexto para componentes client-side.

`useCommandPaletteShortcuts`

Registra:

- `Cmd/Ctrl + K` para alternar a palette;
- `Escape` para fechar.

## Integração com Layout

`AppShell` envolve a aplicação com:

```tsx
<CommandPaletteProvider>
  <SidebarLayout />
  <CommandPaletteRoot />
</CommandPaletteProvider>
```

Isso torna a palette global para todo o Headquarters sem acoplar páginas individuais.

## Integração com Header

`CommandPaletteActions` é client-side e usa `useCommandPalette`.

Os botões de Pesquisa e Command abrem a infraestrutura da palette. Notificações permanece como placeholder desabilitado.

## Preparação para IA

O campo `aiReady` marca itens que poderão ser usados por uma camada futura de IA.

Possíveis usos:

- perguntar sobre um agente;
- resumir um projeto;
- executar uma ação sugerida;
- rotear comando para um agent runtime;
- popular resultados por embeddings ou ranking semântico.

## Decisões Arquiteturais

1. **UI desacoplada do domínio**

   O `@douglas/ui` apenas renderiza. Isso permite reuso em Calma, CRM, Analytics e Brain.

2. **Registry por aplicação**

   O Headquarters conhece suas rotas, projetos e agentes. Por isso o registry fica na app, não no package UI.

3. **Sem execução nesta sprint**

   O método `previewItem` é intencionalmente no-op. Ele reserva a API sem criar comportamento prematuro.

4. **Busca simples por enquanto**

   A busca textual usa `title`, `subtitle`, `kind`, `group` e `keywords`. Isso é suficiente para infraestrutura e pode ser substituído por ranking/IA sem mudar os componentes visuais.

5. **Atalhos como infraestrutura**

   `Cmd/Ctrl + K` já abre a palette, mas atalhos de itens ainda são metadados.

## Evolução Futura

- navegação por item `href`;
- execução de comandos;
- providers por módulo;
- command registry distribuído;
- ranking por uso;
- integração com IA;
- permissões por usuário;
- feature flags;
- atalhos configuráveis;
- analytics de comandos.
