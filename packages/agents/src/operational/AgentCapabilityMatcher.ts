import type {
  OperationalAgent,
  OperationalAgentCapability,
  OperationalAgentManifest,
} from "./OperationalAgentTypes";

export type AgentAssignmentDecision =
  | "assigned"
  | "rejected_incompatible"
  | "rejected_unavailable"
  | "rejected_busy";

export interface AgentCapabilityMatchInput {
  missionType: string;
  requiredCapabilities: OperationalAgentCapability[];
  preferredAgentId?: string;
}

export interface AgentCapabilityMatchResult {
  decision: AgentAssignmentDecision;
  agentId?: string;
  agentName?: string;
  reason: string;
}

export interface AgentAvailabilityPolicy {
  allowAssignWhenBusy: boolean;
}

export const DEFAULT_AGENT_AVAILABILITY_POLICY: AgentAvailabilityPolicy = {
  allowAssignWhenBusy: false,
};

export class AgentCapabilityMatcher {
  constructor(
    private readonly agents: OperationalAgentManifest[],
    private readonly getRuntimeStatus: (agentId: string) => OperationalAgent["status"],
    private readonly policy: AgentAvailabilityPolicy = DEFAULT_AGENT_AVAILABILITY_POLICY,
  ) {}

  match(input: AgentCapabilityMatchInput): AgentCapabilityMatchResult {
    const candidates = this.agents.filter((agent) =>
      agent.supportedMissionTypes.includes(input.missionType),
    );

    if (candidates.length === 0) {
      return {
        decision: "rejected_incompatible",
        reason: "Nenhum agente suporta este tipo de missão",
      };
    }

    const compatible = candidates.filter((agent) =>
      input.requiredCapabilities.every((required) => agent.capabilities.includes(required)),
    );

    if (compatible.length === 0) {
      return {
        decision: "rejected_incompatible",
        reason: "Nenhum agente possui capabilities compatíveis",
      };
    }

    const ordered = input.preferredAgentId
      ? [
          ...compatible.filter((agent) => agent.id === input.preferredAgentId),
          ...compatible.filter((agent) => agent.id !== input.preferredAgentId),
        ]
      : compatible;

    for (const agent of ordered) {
      const status = this.getRuntimeStatus(agent.id);

      if (status === "unavailable") {
        continue;
      }

      if (
        !this.policy.allowAssignWhenBusy &&
        (status === "running" || status === "assigned")
      ) {
        return {
          decision: "rejected_busy",
          agentId: agent.id,
          agentName: agent.name,
          reason: `Agente ${agent.name} ocupado`,
        };
      }

      return {
        decision: "assigned",
        agentId: agent.id,
        agentName: agent.name,
        reason: "Capability match confirmado",
      };
    }

    return {
      decision: "rejected_unavailable",
      reason: "Agentes compatíveis indisponíveis",
    };
  }
}
