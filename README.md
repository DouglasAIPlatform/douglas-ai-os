# Douglas AI Platform

Plataforma de inteligência artificial da Douglas — monorepo profissional com foco em escalabilidade, documentação e organização.

> **Status:** Fundação — estrutura inicial preparada. Conteúdo e implementações serão preenchidos nas próximas sprints.

---

## Visão geral

A Douglas AI Platform é um ecossistema modular para desenvolvimento, orquestração e operação de agentes de IA, APIs e interfaces. Este repositório centraliza aplicações, pacotes compartilhados, automações e documentação técnica.

<!-- TODO: Adicionar diagrama de alto nível e links para demos quando disponíveis -->

---

## Estrutura do monorepo

```
douglas-ai-os/
├── apps/           # Aplicações deployáveis (web, API, workers, etc.)
├── packages/       # Bibliotecas e módulos compartilhados
├── docs/           # Documentação técnica, ADRs e roadmaps
├── scripts/        # Scripts de build, deploy e utilitários
├── automation/     # Pipelines locais, workflows e integrações
├── .cursor/        # Regras e configurações do Cursor IDE
└── .github/        # Workflows CI/CD e templates do GitHub
```

| Diretório     | Propósito                                      |
|---------------|------------------------------------------------|
| `apps/`       | Entry points da plataforma                     |
| `packages/`   | Código reutilizável entre apps                 |
| `docs/`       | Fonte única de verdade para arquitetura e ADRs  |
| `scripts/`    | Automação operacional                          |
| `automation/` | Orquestração e integrações                     |

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [Blueprint v1](docs/architecture/blueprint-v1.md) | Visão arquitetural da plataforma |
| [System Overview](docs/architecture/system-overview.md) | Componentes e fluxos do sistema |
| [Tech Stack](docs/architecture/tech-stack.md) | Stack tecnológica e justificativas |
| [Sprint Foundation](docs/roadmap/sprint-foundation.md) | Roadmap da sprint de fundação |
| [ADR-0001 Monorepo](docs/adr/ADR-0001-monorepo.md) | Decisão de arquitetura: monorepo |
| [ADR-0002 Tech Stack](docs/adr/ADR-0002-tech-stack.md) | Decisão de arquitetura: stack |

<!-- TODO: Adicionar guias de contribuição, setup local e variáveis de ambiente -->

---

## Próximos passos

1. Definir workspace manager (pnpm / Turborepo / Nx)
2. Scaffold das primeiras apps e packages
3. Configurar CI/CD em `.github/workflows/`
4. Preencher documentação em `docs/`

---

## Licença

<!-- TODO: Definir licença do projeto -->
