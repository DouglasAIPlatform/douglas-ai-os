import type { BreadcrumbItem, NavigationSectionData } from "@douglas/ui";
import type { ReactNode } from "react";

export type AppRouteId =
  | "headquarters"
  | "projects"
  | "agents"
  | "brain"
  | "analytics"
  | "settings"
  | "profile";

export type AppRouteSection = "workspace" | "account";

export interface AppRouteDefinition {
  id: AppRouteId;
  label: string;
  path: `/${string}`;
  title: string;
  subtitle: string;
  section: AppRouteSection;
  icon: ReactNode;
  keywords: string[];
  order: number;
}

interface NavigationIconProps {
  path: string;
}

function NavigationIcon({ path }: NavigationIconProps) {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-4)] w-[var(--ds-space-4)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export const appRoutes = [
  {
    id: "headquarters",
    label: "Headquarters",
    path: "/headquarters",
    title: "Headquarters",
    subtitle: "Centro operacional principal da Douglas AI Platform.",
    section: "workspace",
    icon: (
      <NavigationIcon path="m2.25 12 8.954-8.955a1.125 1.125 0 0 1 1.592 0L21.75 12M4.5 9.75v9.375c0 .621.504 1.125 1.125 1.125H9.75v-6h4.5v6h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
    ),
    keywords: ["dashboard", "home", "command-center"],
    order: 10,
  },
  {
    id: "projects",
    label: "Projetos",
    path: "/projects",
    title: "Projetos",
    subtitle: "Portfólio de produtos, iniciativas e entregas estratégicas.",
    section: "workspace",
    icon: (
      <NavigationIcon path="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h3.879c.596 0 1.169.237 1.591.659l1.121 1.122c.422.422.995.659 1.591.659H18a2.25 2.25 0 0 1 2.25 2.25v8.06A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75Z" />
    ),
    keywords: ["products", "portfolio", "roadmap"],
    order: 20,
  },
  {
    id: "brain",
    label: "Brain",
    path: "/brain",
    title: "Brain",
    subtitle: "Memória, conhecimento e inteligência operacional da plataforma.",
    section: "workspace",
    icon: (
      <NavigationIcon path="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a2.25 2.25 0 0 0-1.456-1.456L15.25 7l1.035-.259a2.25 2.25 0 0 0 1.456-1.456L18 4.25l.259 1.035a2.25 2.25 0 0 0 1.456 1.456L20.75 7l-1.035.259a2.25 2.25 0 0 0-1.456 1.456Z" />
    ),
    keywords: ["knowledge", "memory", "intelligence"],
    order: 30,
  },
  {
    id: "agents",
    label: "Agentes",
    path: "/agents",
    title: "Agentes",
    subtitle: "Catálogo de agentes IA, capacidades e estado operacional.",
    section: "workspace",
    icon: (
      <NavigationIcon path="M8.25 7.5V6A3.75 3.75 0 0 1 12 2.25 3.75 3.75 0 0 1 15.75 6v1.5m-9 0h10.5A2.25 2.25 0 0 1 19.5 9.75v7.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25v-7.5A2.25 2.25 0 0 1 6.75 7.5Zm2.25 5.25h.008v.008H9v-.008Zm6 0h.008v.008H15v-.008Z" />
    ),
    keywords: ["ai", "automation", "assistants"],
    order: 40,
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/analytics",
    title: "Analytics",
    subtitle: "Indicadores, métricas e leitura executiva da operação.",
    section: "workspace",
    icon: (
      <NavigationIcon path="M3 13.5h4.5v6H3v-6Zm6.75-9h4.5v15h-4.5v-15Zm6.75 6h4.5v9h-4.5v-9Z" />
    ),
    keywords: ["metrics", "insights", "reports"],
    order: 50,
  },
  {
    id: "settings",
    label: "Configurações",
    path: "/settings",
    title: "Configurações",
    subtitle: "Preferências da plataforma, integrações e políticas globais.",
    section: "account",
    icon: (
      <NavigationIcon path="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.35.78.746.945.396.164.85.09 1.196-.161l.732-.532a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.533.731c-.25.346-.325.8-.16 1.197.164.396.52.675.944.746l.894.149c.542.09.94.56.94 1.109v1.094c0 .55-.398 1.02-.94 1.11l-.894.148c-.424.071-.78.35-.945.747-.164.396-.09.85.161 1.196l.532.732c.321.447.27 1.06-.12 1.45l-.773.773a1.125 1.125 0 0 1-1.45.12l-.732-.532c-.346-.25-.8-.325-1.196-.16a1.125 1.125 0 0 0-.746.944l-.149.894c-.09.542-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.125 1.125 0 0 0-.746-.945 1.125 1.125 0 0 0-1.196.161l-.732.532a1.125 1.125 0 0 1-1.45-.12l-.773-.773a1.125 1.125 0 0 1-.12-1.45l.532-.732c.25-.346.325-.8.16-1.196a1.125 1.125 0 0 0-.944-.747l-.894-.148c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.148c.424-.071.78-.35.945-.747.164-.396.09-.85-.161-1.196l-.532-.732a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.732.532c.346.25.8.325 1.196.16.396-.164.675-.52.746-.944l.149-.894ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    ),
    keywords: ["preferences", "configuration", "admin"],
    order: 90,
  },
  {
    id: "profile",
    label: "Perfil",
    path: "/profile",
    title: "Perfil",
    subtitle: "Dados do usuário, presença e preferências pessoais.",
    section: "account",
    icon: (
      <NavigationIcon path="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    ),
    keywords: ["user", "account", "presence"],
    order: 100,
  },
] satisfies AppRouteDefinition[];

export const routeById = appRoutes.reduce(
  (accumulator, route) => {
    accumulator[route.id] = route;
    return accumulator;
  },
  {} as Record<AppRouteId, AppRouteDefinition>,
);

export const routeSections: Record<AppRouteSection, string> = {
  workspace: "Workspace",
  account: "Conta",
};

function createNavigationSection(section: AppRouteSection): NavigationSectionData {
  const routes = appRoutes
    .filter((route) => route.section === section)
    .sort((a, b) => a.order - b.order);

  return {
    id: section,
    label: routeSections[section],
    items: routes.map((route) => ({
      id: route.id,
      label: route.label,
      href: route.path,
      icon: route.icon,
    })),
  };
}

export const sidebarNavigationSections: NavigationSectionData[] = [
  createNavigationSection("workspace"),
  createNavigationSection("account"),
];

export function getRouteById(routeId: AppRouteId): AppRouteDefinition {
  return routeById[routeId];
}

export function getRouteBreadcrumbs(routeId: AppRouteId): BreadcrumbItem[] {
  const route = getRouteById(routeId);

  return [
    { label: "Douglas AI", href: routeById.headquarters.path },
    { label: route.label },
  ];
}

export function getActiveSidebarHref(pathname: string): string {
  const activeRoute = [...appRoutes]
    .sort((a, b) => b.path.length - a.path.length)
    .find(
      (route) => pathname === route.path || pathname.startsWith(`${route.path}/`),
    );

  return activeRoute?.path ?? routeById.headquarters.path;
}
