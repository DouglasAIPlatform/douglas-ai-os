export interface Project {
  id: string;
  name: string;
  status: string;
  description: string;
  progress: number;
}

export interface Department {
  id: string;
  name: string;
  status: string;
}

export interface Agent {
  id: string;
  name: string;
  status: string;
  role: string;
}

export interface Statistic {
  id: string;
  label: string;
  value: string | number;
  detail: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  status: string;
}

export const projects: Project[] = [
  {
    id: "calma",
    name: "Calma",
    status: "Em Desenvolvimento",
    description: "Plataforma de bem-estar e mindfulness",
    progress: 68,
  },
  {
    id: "youtube-studio",
    name: "YouTube Studio",
    status: "Em Desenvolvimento",
    description: "Gestão e produção de conteúdo em vídeo",
    progress: 54,
  },
];

export const departments: Department[] = [
  { id: "research", name: "Pesquisa", status: "Online" },
  { id: "development", name: "Desenvolvimento", status: "Online" },
  { id: "marketing", name: "Marketing", status: "Online" },
  { id: "content", name: "Conteúdo", status: "Online" },
  { id: "video", name: "Vídeo", status: "Online" },
  { id: "finance", name: "Financeiro", status: "Online" },
  { id: "automation", name: "Automações", status: "Online" },
  { id: "intelligence", name: "Inteligência", status: "Online" },
];

export const agents: Agent[] = [
  { id: "atlas", name: "Atlas", status: "Disponível", role: "Estratégia" },
  { id: "apollo", name: "Apollo", status: "Disponível", role: "Operações" },
  { id: "aurora", name: "Aurora", status: "Disponível", role: "Conteúdo" },
  { id: "hermes", name: "Hermes", status: "Disponível", role: "Comunicação" },
  { id: "athena", name: "Athena", status: "Disponível", role: "Pesquisa" },
  { id: "forge", name: "Forge", status: "Disponível", role: "Construção" },
  { id: "oracle", name: "Oracle", status: "Disponível", role: "Análise" },
  { id: "nova", name: "Nova", status: "Disponível", role: "Criação" },
];

export const statistics: Statistic[] = [
  {
    id: "active-projects",
    label: "Projetos ativos",
    value: projects.length,
    detail: "Em acompanhamento",
  },
  {
    id: "online-departments",
    label: "Departamentos online",
    value: departments.length,
    detail: "Operação saudável",
  },
  {
    id: "available-agents",
    label: "Agentes disponíveis",
    value: agents.length,
    detail: "Prontos para execução",
  },
];

export const activities: Activity[] = [
  {
    id: "activity-foundation",
    title: "Headquarters atualizado",
    description: "Dashboard preparado para widgets desacoplados e dados reais.",
    time: "09:30",
    status: "Sistema",
  },
  {
    id: "activity-agents",
    title: "Agentes sincronizados",
    description: "Lista mockada de agentes disponível para operação.",
    time: "09:12",
    status: "IA",
  },
  {
    id: "activity-projects",
    title: "Projetos revisados",
    description: "Calma e YouTube Studio seguem em desenvolvimento.",
    time: "08:48",
    status: "Produto",
  },
];

export const dailyMission =
  "Evoluir continuamente a Douglas AI Platform.";

export const userName = "Douglas";

export const platformVersion = "0.1";
