# Sprint Foundation — Douglas AI Platform

> **Status:** Placeholder — conteúdo será preenchido posteriormente  
> **Sprint:** Foundation (Sprint 0)

---

## 1. Objetivo da sprint

Estabelecer a fundação técnica e organizacional do monorepo: estrutura de pastas, documentação base, convenções e preparação para implementação das primeiras funcionalidades.

<!-- TODO: Definir OKRs e critérios de conclusão da sprint -->

---

## 2. Escopo

### 2.1 Entregas concluídas (fundação)

- [x] Estrutura de diretórios do monorepo
- [x] Documentação arquitetural inicial (placeholders)
- [x] ADRs iniciais (monorepo e tech stack)
- [ ] Workspace manager e scripts de build
- [ ] CI/CD mínimo (lint, typecheck)
- [ ] Primeira app ou package scaffold

### 2.2 Fora de escopo

<!-- TODO: Listar explicitamente o que NÃO entra nesta sprint -->

- Implementação de features de produto
- Deploy em produção
- Integrações com LLM em produção

---

## 3. Backlog técnico

| ID | Item | Prioridade | Status |
|----|------|------------|--------|
| F-001 | Definir workspace manager (pnpm + Turborepo) | Alta | Pendente |
| F-002 | Configurar ESLint + Prettier compartilhados | Alta | Pendente |
| F-003 | Workflow CI em `.github/workflows/` | Alta | Pendente |
| F-004 | Scaffold `packages/config` ou similar | Média | Pendente |
| F-005 | Guia de setup local no README | Média | Pendente |
| F-006 | Preencher blueprint e system overview | Média | Pendente |

<!-- TODO: Refinar estimativas e responsáveis -->

---

## 4. Marcos (milestones)

| Marco | Descrição | Data alvo |
|-------|-----------|-----------|
| M0 | Estrutura e docs placeholder | — |
| M1 | Tooling monorepo funcional | — |
| M2 | CI verde no repositório | — |
| M3 | Primeiro deployável (hello world) | — |

---

## 5. Riscos e dependências

| Risco / Dependência | Impacto | Mitigação |
|---------------------|---------|-----------|
| Stack ainda não fechada | Médio | ADR-0002 em revisão |
| — | — | — |

<!-- TODO: Atualizar conforme sprint avança -->

---

## 6. Definição de pronto (DoD)

<!-- TODO: Checklist padrão para itens desta sprint -->

- [ ] Código revisado
- [ ] Documentação atualizada
- [ ] CI passando
- [ ] Sem secrets commitados

---

## 7. Referências

- [Blueprint v1](../architecture/blueprint-v1.md)
- [ADR-0001: Monorepo](../adr/ADR-0001-monorepo.md)
- [ADR-0002: Tech Stack](../adr/ADR-0002-tech-stack.md)
