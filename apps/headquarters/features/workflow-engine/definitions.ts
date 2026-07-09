import {
  WORKFLOW_DEPARTMENTS,
  createAction,
  createPipeline,
  createTrigger,
  createWorkflow,
  createWorkflowTask,
  type Workflow,
} from "@douglas/workflow";

function buildDepartmentWorkflow(
  id: string,
  name: string,
  description: string,
  department: string,
  taskName: string,
  actionLabel: string,
): Workflow {
  const taskId = `task:${id}:main`;
  const triggerId = `trigger:${id}:manual`;

  return createWorkflow({
    id: `workflow:${id}`,
    name,
    description,
    department,
    status: "active",
    pipeline: createPipeline({
      id: `pipeline:${id}`,
      name: `${name} Pipeline`,
      description: `Pipeline automático do departamento ${department}.`,
      stages: [
        {
          id: `stage:${id}:1`,
          name: "Execução principal",
          taskIds: [taskId],
          order: 1,
        },
      ],
    }),
    tasks: [
      createWorkflowTask({
        id: taskId,
        name: taskName,
        description: `Tarefa principal do fluxo ${name}.`,
        order: 1,
        actions: [
          createAction({
            id: `action:${id}:main`,
            type: "log",
            label: actionLabel,
            config: { department, simulated: true },
          }),
        ],
      }),
    ],
    triggers: [
      createTrigger({
        id: triggerId,
        type: "manual",
        label: `Disparar ${name}`,
        config: { department },
      }),
    ],
    metadata: {
      workspaceId: "ws:douglas-os",
      tags: [department, "workflow"],
    },
  });
}

export const workflowDefinitions: Workflow[] = [
  buildDepartmentWorkflow(
    "youtube-publish",
    "Publicação YouTube",
    "Fluxo de revisão e publicação de conteúdo em vídeo.",
    WORKFLOW_DEPARTMENTS.YOUTUBE,
    "Revisar e publicar vídeo",
    "Simular publicação no YouTube",
  ),
  buildDepartmentWorkflow(
    "calma-onboarding",
    "Onboarding Calma",
    "Fluxo de boas-vindas e configuração inicial do usuário Calma.",
    WORKFLOW_DEPARTMENTS.CALMA,
    "Configurar jornada inicial",
    "Simular onboarding Calma",
  ),
  buildDepartmentWorkflow(
    "marketing-campaign",
    "Campanha Marketing",
    "Fluxo de criação e lançamento de campanhas.",
    WORKFLOW_DEPARTMENTS.MARKETING,
    "Lançar campanha",
    "Simular lançamento de campanha",
  ),
  buildDepartmentWorkflow(
    "financeiro-report",
    "Relatório Financeiro",
    "Fluxo de consolidação e emissão de relatórios financeiros.",
    WORKFLOW_DEPARTMENTS.FINANCEIRO,
    "Gerar relatório mensal",
    "Simular geração de relatório",
  ),
  buildDepartmentWorkflow(
    "crm-followup",
    "Follow-up CRM",
    "Fluxo de acompanhamento automatizado de leads.",
    WORKFLOW_DEPARTMENTS.CRM,
    "Executar follow-up",
    "Simular follow-up de lead",
  ),
];
