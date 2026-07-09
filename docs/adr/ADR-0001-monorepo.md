# ADR-0001: Adoção de arquitetura monorepo

| Campo | Valor |
|-------|-------|
| **Status** | Proposed |
| **Data** | — |
| **Decisores** | Engenharia Douglas AI Platform |

---

## Contexto

A Douglas AI Platform envolve múltiplas aplicações (frontend, APIs, workers), bibliotecas compartilhadas (SDK, UI, core de agentes), documentação e automações. É necessário definir como o código será organizado em repositório(s) para suportar escala, reuso e consistência.

<!-- TODO: Adicionar restrições de time, release cadence e ferramentas já usadas -->

---

## Decisão

Adotar um **monorepo único** (`douglas-ai-os`) com a seguinte estrutura de alto nível:

- `apps/` — aplicações deployáveis
- `packages/` — código compartilhado versionado internamente
- `docs/` — documentação técnica e ADRs
- `scripts/` e `automation/` — operação e CI local

<!-- TODO: Confirmar ferramenta de workspace (pnpm workspaces, Turborepo, Nx) -->

---

## Consequências

### Positivas

- Refactors e mudanças de API compartilhada em um único PR
- Documentação e código no mesmo ciclo de versionamento
- Visibilidade total do sistema para engenharia
- CI unificado e políticas consistentes

### Negativas

- Repositório pode crescer rapidamente — exige disciplina de boundaries
- CI precisa de cache e execução incremental (affected packages)
- Curva de aprendizado em tooling de monorepo

### Neutras

- Migração futura para polyrepo permanece possível, porém custosa

---

## Alternativas consideradas

### Polyrepo (um repositório por app/package)

<!-- TODO: Descrever prós/contras específicos do contexto Douglas -->

**Rejeitada** para a fase inicial: overhead de sincronização entre repos e versionamento de packages internos.

### Monorepo com submódulos Git

**Rejeitada**: complexidade operacional sem benefício claro nesta fase.

---

## Implementação

<!-- TODO: Detalhar após escolha do workspace manager -->

1. Manter boundaries claros entre `apps/` e `packages/`
2. Proibir dependências circulares entre packages
3. Documentar convenções de naming e imports
4. Configurar CI para rodar apenas em pacotes afetados

---

## Referências

- [Blueprint v1](../architecture/blueprint-v1.md)
- [Sprint Foundation](../roadmap/sprint-foundation.md)
