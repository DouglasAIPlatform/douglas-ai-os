import { createPlugin, type Plugin } from "@douglas/plugins";
import { createPluginManifest } from "@douglas/plugins";

export const calmaPlugin: Plugin = createPlugin(
  createPluginManifest({
    id: "calma",
    name: "Calma",
    description: "Produto de mindfulness e bem-estar da Douglas AI.",
    version: "0.1.0",
    packageName: "@douglas/calma",
    metadata: { tags: ["wellness", "product"], author: "Douglas AI" },
    routes: [
      {
        id: "calma-home",
        path: "/calma",
        title: "Calma",
        label: "Calma",
        subtitle: "Jornadas de mindfulness e sessões guiadas.",
        order: 10,
        componentId: "calma:HomePage",
        keywords: ["mindfulness", "meditation", "wellness"],
      },
      {
        id: "calma-sessions",
        path: "/calma/sessions",
        title: "Sessões",
        label: "Sessões",
        order: 20,
        componentId: "calma:SessionsPage",
      },
    ],
    menus: [
      {
        id: "menu:calma-home",
        label: "Calma",
        section: "products",
        routeId: "calma-home",
        order: 10,
        iconId: "icon:calma",
      },
      {
        id: "menu:calma-sessions",
        label: "Sessões",
        section: "products",
        routeId: "calma-sessions",
        order: 20,
        iconId: "icon:calma-sessions",
      },
    ],
    widgets: [
      {
        id: "widget:calma-streak",
        name: "Sequência de sessões",
        slot: "dashboard",
        order: 10,
        componentId: "calma:StreakWidget",
      },
    ],
    agents: [
      {
        id: "agent:calma-guide",
        name: "Calma Guide",
        description: "Agente de acompanhamento para jornadas de mindfulness.",
        department: "Calma",
        capabilities: ["guidance", "personalization"],
        permissions: ["read:calma", "write:calma:sessions"],
      },
    ],
    events: [
      {
        topic: "calma:session:started",
        description: "Usuário iniciou uma sessão Calma.",
        publishers: ["calma"],
        subscribers: ["analytics", "notifications"],
      },
      {
        topic: "calma:session:completed",
        description: "Usuário concluiu uma sessão Calma.",
        publishers: ["calma"],
        subscribers: ["analytics", "notifications", "memory"],
      },
    ],
    permissions: [
      {
        id: "read:calma",
        label: "Ler Calma",
        description: "Visualizar conteúdo e sessões do Calma.",
        scope: "read",
      },
      {
        id: "write:calma:sessions",
        label: "Gerenciar sessões",
        description: "Criar e editar sessões Calma.",
        scope: "write",
      },
    ],
  }),
);

export const youtubeStudioPlugin: Plugin = createPlugin(
  createPluginManifest({
    id: "youtube-studio",
    name: "YouTube Studio",
    description: "Gestão de conteúdo, upload e analytics do YouTube.",
    version: "0.1.0",
    packageName: "@douglas/youtube-studio",
    metadata: { tags: ["content", "product", "youtube"] },
    routes: [
      {
        id: "youtube-dashboard",
        path: "/youtube",
        title: "YouTube Studio",
        label: "YouTube",
        subtitle: "Central de produção e publicação de vídeos.",
        order: 10,
        componentId: "youtube:DashboardPage",
        keywords: ["youtube", "video", "content"],
      },
      {
        id: "youtube-upload",
        path: "/youtube/upload",
        title: "Upload",
        label: "Upload",
        order: 20,
        componentId: "youtube:UploadPage",
      },
    ],
    menus: [
      {
        id: "menu:youtube-dashboard",
        label: "YouTube Studio",
        section: "products",
        routeId: "youtube-dashboard",
        order: 30,
        iconId: "icon:youtube",
      },
      {
        id: "menu:youtube-upload",
        label: "Upload",
        section: "products",
        routeId: "youtube-upload",
        order: 40,
        iconId: "icon:upload",
      },
    ],
    widgets: [
      {
        id: "widget:youtube-stats",
        name: "Estatísticas do canal",
        slot: "dashboard",
        order: 20,
        componentId: "youtube:ChannelStatsWidget",
      },
    ],
    agents: [
      {
        id: "agent:youtube-producer",
        name: "YouTube Producer",
        description: "Agente para roteiro, SEO e publicação de vídeos.",
        department: "Conteúdo",
        capabilities: ["scriptwriting", "seo", "publishing"],
        permissions: ["read:youtube", "write:youtube:content", "execute:youtube:publish"],
      },
    ],
    events: [
      {
        topic: "youtube:video:uploaded",
        description: "Vídeo enviado ao YouTube Studio.",
        publishers: ["youtube-studio"],
        subscribers: ["analytics", "workflow", "notifications"],
      },
      {
        topic: "youtube:video:published",
        description: "Vídeo publicado no YouTube.",
        publishers: ["youtube-studio"],
        subscribers: ["analytics", "notifications", "marketing"],
      },
    ],
    permissions: [
      {
        id: "read:youtube",
        label: "Ler YouTube Studio",
        description: "Visualizar canal e vídeos.",
        scope: "read",
      },
      {
        id: "write:youtube:content",
        label: "Editar conteúdo",
        description: "Criar e editar vídeos e metadados.",
        scope: "write",
      },
      {
        id: "execute:youtube:publish",
        label: "Publicar vídeos",
        description: "Executar publicação no YouTube.",
        scope: "execute",
      },
    ],
  }),
);

export const crmPlugin: Plugin = createPlugin(
  createPluginManifest({
    id: "crm",
    name: "CRM",
    description: "Gestão de leads, pipeline e relacionamento com clientes.",
    version: "0.1.0",
    packageName: "@douglas/crm",
    metadata: { tags: ["sales", "product", "crm"] },
    routes: [
      {
        id: "crm-pipeline",
        path: "/crm",
        title: "CRM",
        label: "CRM",
        subtitle: "Pipeline de vendas e gestão de leads.",
        order: 10,
        componentId: "crm:PipelinePage",
        keywords: ["crm", "leads", "sales"],
      },
      {
        id: "crm-contacts",
        path: "/crm/contacts",
        title: "Contatos",
        label: "Contatos",
        order: 20,
        componentId: "crm:ContactsPage",
      },
    ],
    menus: [
      {
        id: "menu:crm-pipeline",
        label: "CRM",
        section: "products",
        routeId: "crm-pipeline",
        order: 50,
        iconId: "icon:crm",
      },
      {
        id: "menu:crm-contacts",
        label: "Contatos",
        section: "products",
        routeId: "crm-contacts",
        order: 60,
        iconId: "icon:contacts",
      },
    ],
    widgets: [
      {
        id: "widget:crm-leads",
        name: "Leads recentes",
        slot: "dashboard",
        order: 30,
        componentId: "crm:RecentLeadsWidget",
      },
    ],
    agents: [
      {
        id: "agent:crm-closer",
        name: "CRM Closer",
        description: "Agente de follow-up e qualificação de leads.",
        department: "Vendas",
        capabilities: ["qualification", "follow-up", "analysis"],
        permissions: ["read:crm", "write:crm:leads"],
      },
    ],
    events: [
      {
        topic: "crm:lead:created",
        description: "Novo lead registrado no CRM.",
        publishers: ["crm"],
        subscribers: ["analytics", "notifications", "agents"],
      },
      {
        topic: "crm:deal:closed",
        description: "Negócio fechado no pipeline.",
        publishers: ["crm"],
        subscribers: ["analytics", "notifications", "financeiro"],
      },
    ],
    permissions: [
      {
        id: "read:crm",
        label: "Ler CRM",
        description: "Visualizar leads e pipeline.",
        scope: "read",
      },
      {
        id: "write:crm:leads",
        label: "Gerenciar leads",
        description: "Criar e editar leads e contatos.",
        scope: "write",
      },
    ],
  }),
);

export const productPlugins: Plugin[] = [
  calmaPlugin,
  youtubeStudioPlugin,
  crmPlugin,
];
