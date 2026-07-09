import { agents, projects } from "@/lib/mock-data";
import { appRoutes } from "@/config/routes";
import type { CommandPaletteGroup, CommandPaletteRegistry } from "./types";

function createIcon(label: string) {
  return (
    <span className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)]">
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

const pageItems = appRoutes.map((route) => ({
  id: `page:${route.id}`,
  kind: "page" as const,
  title: route.label,
  subtitle: route.subtitle,
  keywords: route.keywords,
  group: "pages",
  icon: route.icon,
  href: route.path,
  shortcut: route.id === "headquarters" ? ["G", "H"] : undefined,
  status: "available" as const,
}));

const commandItems = [
  {
    id: "command:open-module",
    kind: "command" as const,
    title: "Abrir módulo",
    subtitle: "Infraestrutura preparada para abrir módulos futuramente.",
    keywords: ["open", "module", "abrir", "módulo"],
    group: "commands",
    icon: createIcon("cmd"),
    shortcut: ["⌘", "O"],
    status: "planned" as const,
  },
  {
    id: "command:run-agent",
    kind: "command" as const,
    title: "Executar agente",
    subtitle: "Preparado para acionar agentes quando runtime existir.",
    keywords: ["run", "agent", "executar", "ia"],
    group: "commands",
    icon: createIcon("ai"),
    shortcut: ["⌘", "J"],
    status: "planned" as const,
    aiReady: true,
  },
  {
    id: "command:ask-ai",
    kind: "ai" as const,
    title: "Perguntar à IA",
    subtitle: "Entrada reservada para integração futura com IA.",
    keywords: ["ai", "ask", "perguntar", "douglas"],
    group: "commands",
    icon: createIcon("ia"),
    shortcut: ["⌘", "K"],
    status: "planned" as const,
    aiReady: true,
  },
];

export function buildCommandPaletteRegistry(
  includeWidgetMocks = true,
): CommandPaletteRegistry {
  const projectItems = includeWidgetMocks
    ? projects.map((project) => ({
        id: `project:${project.id}`,
        kind: "project" as const,
        title: project.name,
        subtitle: project.description,
        keywords: [project.name, project.status, "project", "produto"],
        group: "projects",
        icon: createIcon(project.name),
        status: "planned" as const,
      }))
    : [];

  const agentItems = includeWidgetMocks
    ? agents.map((agent) => ({
        id: `agent:${agent.id}`,
        kind: "agent" as const,
        title: agent.name,
        subtitle: agent.role,
        keywords: [agent.name, agent.role, "agent", "ia"],
        group: "agents",
        icon: createIcon(agent.name),
        status: "planned" as const,
        aiReady: true,
      }))
    : [];

  const groups: CommandPaletteGroup[] = [
    {
      id: "pages",
      label: "Páginas",
      items: pageItems,
    },
    {
      id: "commands",
      label: "Comandos",
      items: commandItems,
    },
  ];

  if (agentItems.length > 0) {
    groups.splice(1, 0, {
      id: "agents",
      label: "Agentes",
      items: agentItems,
    });
  }

  if (projectItems.length > 0) {
    groups.splice(agentItems.length > 0 ? 2 : 1, 0, {
      id: "projects",
      label: "Projetos",
      items: projectItems,
    });
  }

  return { groups };
}

/** Registry padrão com mocks — preferir `buildCommandPaletteRegistry` com demo gate. */
export const commandPaletteRegistry = buildCommandPaletteRegistry(true);
