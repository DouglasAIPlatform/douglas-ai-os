import { appRoutes, routeById } from "@/config/routes";
import { agents, departments, projects, userName } from "@/lib/mock-data";
import type { AppRouteId } from "@/config/routes";
import type { SearchIndex, SearchRecord } from "./types";

const routeTypeById: Partial<Record<AppRouteId, SearchRecord["type"]>> = {
  agents: "agent",
  projects: "project",
  settings: "setting",
  profile: "user",
};

const settingsRecords: SearchRecord[] = [
  {
    id: "setting:general",
    type: "setting",
    title: "Configurações Gerais",
    description: "Preferências globais da Douglas AI Platform.",
    href: routeById.settings.path,
    keywords: ["settings", "configurações", "preferências", "global"],
  },
  {
    id: "setting:command-palette",
    type: "setting",
    title: "Command Palette",
    description: "Infraestrutura de comandos, atalhos e busca rápida.",
    href: routeById.settings.path,
    keywords: ["command", "palette", "atalhos", "pesquisa"],
  },
];

const userRecords: SearchRecord[] = [
  {
    id: "user:douglas",
    type: "user",
    title: userName,
    description: "Usuário executivo principal da plataforma.",
    href: routeById.profile.path,
    keywords: ["douglas", "usuário", "perfil", "executivo"],
  },
];

const documentationRecords: SearchRecord[] = [
  {
    id: "docs:routing",
    type: "documentation",
    title: "Routing Architecture",
    description: "Arquitetura centralizada de rotas e navegação.",
    href: "/docs/architecture/routing-architecture",
    keywords: ["docs", "rotas", "routing", "sidebar", "breadcrumbs"],
  },
  {
    id: "docs:command-palette",
    type: "documentation",
    title: "Command Palette Architecture",
    description: "Infraestrutura do Douglas Command Palette.",
    href: "/docs/architecture/command-palette",
    keywords: ["docs", "command", "palette", "atalhos", "ia"],
  },
  {
    id: "docs:design-language",
    type: "documentation",
    title: "Design Language",
    description: "Filosofia visual e tokens da Douglas AI Platform.",
    href: "/docs/design-language",
    keywords: ["docs", "design", "tokens", "ui", "figma"],
  },
];

export interface CreateSearchIndexOptions {
  includeWidgetMocks?: boolean;
}

export function createSearchIndex(
  options: CreateSearchIndexOptions = {},
): SearchIndex {
  const includeWidgetMocks = options.includeWidgetMocks ?? true;
  const pageRecords: SearchRecord[] = appRoutes.map((route) => ({
    id: `page:${route.id}`,
    type: routeTypeById[route.id] ?? "documentation",
    title: route.title,
    description: route.subtitle,
    href: route.path,
    keywords: [route.label, route.section, ...route.keywords],
    metadata: {
      routeId: route.id,
      section: route.section,
      source: "route",
    },
  }));

  const projectRecords: SearchRecord[] = includeWidgetMocks
    ? projects.map((project) => ({
        id: `project:${project.id}`,
        type: "project",
        title: project.name,
        description: project.description,
        href: routeById.projects.path,
        keywords: [project.name, project.status, "project", "projeto", "produto"],
        metadata: {
          status: project.status,
          progress: project.progress,
        },
      }))
    : [];

  const departmentRecords: SearchRecord[] = includeWidgetMocks
    ? departments.map((department) => ({
        id: `department:${department.id}`,
        type: "department",
        title: department.name,
        description: `Departamento ${department.name} está ${department.status}.`,
        href: routeById.headquarters.path,
        keywords: [department.name, department.status, "department", "departamento"],
        metadata: {
          status: department.status,
        },
      }))
    : [];

  const agentRecords: SearchRecord[] = includeWidgetMocks
    ? agents.map((agent) => ({
        id: `agent:${agent.id}`,
        type: "agent",
        title: agent.name,
        description: `${agent.role} — ${agent.status}`,
        href: routeById.agents.path,
        keywords: [agent.name, agent.role, agent.status, "agent", "agente", "ia"],
        metadata: {
          role: agent.role,
          status: agent.status,
        },
      }))
    : [];

  return {
    records: [
      ...pageRecords,
      ...projectRecords,
      ...departmentRecords,
      ...agentRecords,
      ...settingsRecords,
      ...(includeWidgetMocks ? userRecords : []),
      ...documentationRecords,
    ],
    version: "0.1.0",
    source: "mock",
    generatedAt: includeWidgetMocks ? "mock-index" : "mock-index:routes-only",
  };
}
