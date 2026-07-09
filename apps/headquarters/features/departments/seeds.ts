import type { DepartmentDefinition, DepartmentSeedData } from "@douglas/departments";

export const departmentDefinitions: DepartmentDefinition[] = [
  {
    id: "pesquisa",
    name: "Pesquisa",
    description: "Pesquisa, retrieval e consolidação de conhecimento.",
    status: "active",
    metadata: { tags: ["research", "knowledge"], lead: "Athena" },
  },
  {
    id: "desenvolvimento",
    name: "Desenvolvimento",
    description: "Construção técnica e implementação de soluções.",
    status: "active",
    metadata: { tags: ["engineering", "build"], lead: "Forge" },
  },
  {
    id: "ux",
    name: "UX",
    description: "Experiência do usuário, design e usabilidade.",
    status: "idle",
    metadata: { tags: ["design", "ux"] },
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Comunicação, campanhas e relacionamento.",
    status: "active",
    metadata: { tags: ["marketing", "communication"], lead: "Hermes" },
  },
  {
    id: "conteudo",
    name: "Conteúdo",
    description: "Produção e curadoria de conteúdo.",
    status: "active",
    metadata: { tags: ["content", "creative"], lead: "Aurora" },
  },
  {
    id: "video",
    name: "Vídeo",
    description: "Produção audiovisual e YouTube Studio.",
    status: "active",
    metadata: { tags: ["video", "youtube"], lead: "Nova" },
  },
  {
    id: "financeiro",
    name: "Financeiro",
    description: "Métricas financeiras, previsões e análise de dados.",
    status: "active",
    metadata: { tags: ["finance", "analytics"], lead: "Oracle" },
  },
  {
    id: "automacoes",
    name: "Automações",
    description: "Execução de fluxos e automações internas.",
    status: "active",
    metadata: { tags: ["automation", "operations"], lead: "Apollo" },
  },
  {
    id: "inteligencia",
    name: "Inteligência",
    description: "Visão estratégica, priorização e decisões.",
    status: "active",
    metadata: { tags: ["strategy", "leadership"], lead: "Atlas" },
  },
];

export const departmentSeedData: DepartmentSeedData = {
  agentRegistrations: [
    { departmentId: "pesquisa", agentId: "agent:athena" },
    { departmentId: "desenvolvimento", agentId: "agent:forge" },
    { departmentId: "marketing", agentId: "agent:hermes" },
    { departmentId: "conteudo", agentId: "agent:aurora" },
    { departmentId: "video", agentId: "agent:nova" },
    { departmentId: "financeiro", agentId: "agent:oracle" },
    { departmentId: "automacoes", agentId: "agent:apollo" },
    { departmentId: "inteligencia", agentId: "agent:atlas" },
  ],
  tasks: [
    {
      departmentId: "pesquisa",
      task: { title: "Consolidar base de conhecimento Q3", priority: "high" },
    },
    {
      departmentId: "desenvolvimento",
      task: { title: "Implementar Sprint 4.1", priority: "high" },
    },
    {
      departmentId: "marketing",
      task: { title: "Revisar campanha de lançamento", priority: "normal" },
    },
  ],
  events: [
    {
      departmentId: "inteligencia",
      topic: "department:strategy:updated",
      payload: { quarter: "Q3" },
    },
    {
      departmentId: "automacoes",
      topic: "department:workflow:triggered",
      payload: { workflowId: "workflow:youtube-publish" },
    },
  ],
  metrics: [
    {
      departmentId: "pesquisa",
      key: "documents_indexed",
      label: "Documentos indexados",
      value: 128,
    },
    {
      departmentId: "financeiro",
      key: "reports_generated",
      label: "Relatórios gerados",
      value: 12,
    },
    {
      departmentId: "video",
      key: "videos_published",
      label: "Vídeos publicados",
      value: 24,
    },
  ],
};
