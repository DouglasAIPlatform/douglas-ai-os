# Tech Stack — Douglas AI Platform

> **Status:** Placeholder — conteúdo será preenchido posteriormente  
> **Decisão formal:** [ADR-0002: Tech Stack](../adr/ADR-0002-tech-stack.md)

---

## 1. Visão geral

Este documento consolida as tecnologias escolhidas (ou em avaliação) para cada camada da plataforma, com links para ADRs quando aplicável.

<!-- TODO: Revisar stack após definição de requisitos não-funcionais -->

---

## 2. Monorepo e tooling

| Área | Tecnologia | Notas |
|------|------------|-------|
| Gerenciador de pacotes | *A definir* | Ver ADR-0001 |
| Build / cache | *A definir* | Turborepo, Nx ou similar |
| Lint / format | *A definir* | ESLint, Prettier, etc. |
| Type system | *A definir* | TypeScript recomendado |

---

## 3. Frontend

| Área | Tecnologia | Notas |
|------|------------|-------|
| Framework | *A definir* | Ver `docs/frontend/` |
| Styling | *A definir* | |
| State management | *A definir* | |
| Testes | *A definir* | |

<!-- TODO: Detalhar em docs/frontend/ -->

---

## 4. Backend e API

| Área | Tecnologia | Notas |
|------|------------|-------|
| Runtime | *A definir* | Ver `docs/backend/` |
| Framework HTTP | *A definir* | |
| Validação / schemas | *A definir* | |
| Autenticação | *A definir* | Ver `docs/security/` |

<!-- TODO: Detalhar em docs/backend/ e docs/api/ -->

---

## 5. Agentes e IA

| Área | Tecnologia | Notas |
|------|------------|-------|
| Orquestração | *A definir* | Ver `docs/agents/` |
| LLM providers | *A definir* | |
| Embeddings / RAG | *A definir* | |
| Tooling | *A definir* | |

---

## 6. Dados e persistência

| Área | Tecnologia | Notas |
|------|------------|-------|
| Banco principal | *A definir* | Ver `docs/database/` |
| Cache | *A definir* | |
| Filas / eventos | *A definir* | |
| Object storage | *A definir* | |

---

## 7. Infraestrutura e DevOps

| Área | Tecnologia | Notas |
|------|------------|-------|
| CI/CD | GitHub Actions | `.github/workflows/` |
| Containers | *A definir* | |
| IaC | *A definir* | |
| Observabilidade | *A definir* | |

---

## 8. Critérios de seleção

<!-- TODO: Documentar critérios usados para escolher cada tecnologia -->

1. Maturidade e comunidade
2. Adequação ao time
3. Custo operacional
4. Integração com ecossistema monorepo
5. Segurança e compliance

---

## 9. Alternativas consideradas

<!-- TODO: Tabela de alternativas rejeitadas com motivo breve -->
