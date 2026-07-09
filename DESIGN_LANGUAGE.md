# Douglas AI Platform — Design Language

> Status: Foundation v0.1  
> Escopo: linguagem visual, tokens oficiais e regras de uso para a Douglas AI Platform.

## 1. Filosofia Visual

A Douglas AI Platform deve parecer um sistema operacional executivo: silencioso, preciso e confiável. A interface não compete com o trabalho do usuário; ela organiza contexto, decisões e operações com clareza.

A inspiração vem de princípios vistos em Linear, Vercel, Notion, GitHub e Stripe: hierarquia limpa, superfícies discretas, foco no conteúdo e interação com baixa fricção. A identidade da Douglas AI, porém, deve ser própria: neutra, institucional, levemente futurista e orientada a comando.

## 2. Princípios

1. **Clareza antes de decoração**  
   Cada camada visual precisa ajudar o usuário a entender prioridade, estado ou relação.

2. **Premium por precisão**  
   A sensação premium vem de espaçamento consistente, tipografia controlada, contraste adequado e movimento sutil.

3. **Composição escalável**  
   Componentes devem aceitar dados via props e consumir tokens, não decisões visuais locais.

4. **Tema como infraestrutura**  
   Light e dark mode são variações dos mesmos tokens sem bifurcar componentes.

5. **Acessibilidade como padrão**  
   Foco visível, contraste, semântica e estados não são extras; fazem parte do sistema.

## 3. Arquivos Oficiais

| Arquivo | Função |
|---|---|
| `packages/ui/src/styles/tokens.css` | Tokens runtime em CSS variables e tema light/dark |
| `packages/ui/src/tokens.ts` | Manifesto TypeScript dos tokens para tooling e futura exportação |
| `packages/ui/src/index.ts` | API pública do design system |
| `apps/headquarters/app/globals.css` | Importa Tailwind e os tokens oficiais |
| `DESIGN_LANGUAGE.md` | Filosofia, justificativas e regras de uso |

## 4. Tokens

Todos os tokens usam o prefixo `--ds-*`. Esse prefixo evita colisões com variáveis de apps e deixa claro que o valor pertence ao Design System.

### 4.1 Spacing

Baseado em escala de 4px com passos intermediários para ajustes finos:

- `--ds-space-1` = 4px
- `--ds-space-2` = 8px
- `--ds-space-3` = 12px
- `--ds-space-4` = 16px
- `--ds-space-6` = 24px
- `--ds-space-8` = 32px
- `--ds-space-16` = 64px

Justificativa: uma escala curta reduz variação visual, acelera decisões e mantém consistência entre cards, headers, sidebars e widgets.

### 4.2 Typography

A plataforma usa Inter via `next/font` no app e expõe a família por `--ds-font-family-sans`.

Escala:

- `2xs` e `xs`: labels, badges, metadados
- `sm`: texto operacional padrão
- `md`: corpo de maior importância
- `lg` a `4xl`: títulos, hero e chamadas executivas

Pesos:

- Regular para leitura
- Medium para itens interativos e labels relevantes
- Semibold para títulos
- Bold apenas para marcas e avatares

Justificativa: interfaces executivas precisam de leitura rápida. A hierarquia por tamanho e peso substitui excesso de cor.

### 4.3 Grid

O grid oficial define:

- `--ds-grid-max-width`: largura máxima do conteúdo
- `--ds-grid-gutter-sm/md/lg`: gutters responsivos
- `--ds-sidebar-width-collapsed`
- `--ds-sidebar-width-expanded`

Justificativa: o layout precisa crescer para dashboards, CRM, Analytics e apps futuras sem recalcular larguras manualmente.

### 4.4 Radius

Escala:

- `xs/sm`: controles compactos
- `md`: itens de lista e inputs
- `lg/xl/2xl`: cards e containers
- `panel`: blocos institucionais
- `full`: pills, badges e indicadores

Justificativa: radius maior cria uma interface moderna, mas a escala evita que todos os elementos pareçam iguais.

### 4.5 Elevation, Borders e Shadows

Elevação:

- `xs`: controles pequenos
- `sm`: cards padrão
- `md`: hover e elementos elevados
- `lg`: drawers e overlays
- `featured`: blocos escuros ou hero

Borders:

- `subtle`: separação discreta
- `default`: containers e controles
- `strong`: hover, active e foco visual
- `inverse`: superfícies escuras

Justificativa: em uma interface premium, borda e sombra trabalham juntas para criar profundidade sem poluição visual.

### 4.6 Motion, Transitions e Animations

Tempos:

- `fast` = micro feedback
- `normal` = hover/focus
- `slow` = layout e expansão
- `loading` = shimmer/pulse

Easing:

- `standard`: transições comuns
- `emphasized`: entradas e mudanças de layout futuras

Animação oficial atual:

- `ds-animate-pulse-soft`

Justificativa: movimento deve confirmar estado, não chamar atenção indevida.

### 4.7 Focus States

Todo controle interativo deve usar `--ds-shadow-focus`.

Justificativa: foco por sombra mantém visibilidade em light/dark mode e evita depender apenas de cor, melhorando acessibilidade.

### 4.8 Hover States

Hover usa:

- `--ds-state-overlay-hover`
- `--ds-state-hover-transform`
- `--ds-elevation-md` quando o elemento pode elevar

Justificativa: o hover deve indicar interatividade de forma elegante e previsível.

### 4.9 Loading, Empty e Error States

Estados oficiais:

- Loading: pulse suave + `aria-busy`
- Empty: borda dashed + mensagem orientada a próxima etapa
- Error: `role="alert"` + cor semântica danger

Justificativa: estados são parte do produto. Eles devem ter linguagem visual própria e serem previsíveis em todos os widgets.

## 5. Temas

`tokens.css` define:

- `:root` e `[data-theme="light"]`
- `[data-theme="dark"]`
- fallback automático via `prefers-color-scheme`

Componentes não devem escrever lógica própria de tema. Eles devem consumir tokens sem saber se a plataforma está em light ou dark mode.

## 6. Acessibilidade

Regras obrigatórias:

- Usar elementos semânticos (`header`, `nav`, `main`, `time`, `button`)
- Manter foco visível em controles interativos
- Não comunicar estado apenas por cor
- Preservar contraste adequado entre texto e superfície
- Usar `aria-live`, `aria-busy` e `role="alert"` em estados dinâmicos

## 7. Preparação para Figma

O arquivo `tokens.ts` existe para servir como ponte futura com:

- Token Studio
- Figma Variables
- documentação automatizada
- checagens de consistência em CI

Os nomes em CSS e TypeScript devem continuar alinhados. Mudanças em tokens devem ser feitas por decisão arquitetural, não por necessidade pontual de uma tela.

## 8. Regras de Implementação

1. Componentes devem usar `--ds-*` para cor, spacing, radius, shadow, motion e estados.
2. Não usar valores arbitrários novos sem transformar em token.
3. Apps podem compor layouts, mas não devem redefinir a linguagem visual.
4. Novos componentes em `packages/ui` devem exportar tipos e respeitar light/dark mode.
5. Widgets de produto podem viver em apps, mas devem consumir primitives e tokens oficiais.

## 9. Identidade Douglas AI

A identidade visual da Douglas AI é:

- Neutra, mas não fria
- Executiva, mas não corporativa demais
- Precisa, mas humana
- Futurista por comportamento, não por excesso visual

O objetivo é que a plataforma pareça um lugar de comando: cada detalhe reduz ruído e aumenta confiança.
