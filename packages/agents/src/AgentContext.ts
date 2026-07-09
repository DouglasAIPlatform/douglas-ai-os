"use client";

import { createContext } from "react";
import type { AgentEventBus } from "./AgentEvents";
import type { AgentFactory } from "./AgentFactory";
import type { AgentManager } from "./AgentManager";
import type { AgentRegistry } from "./AgentRegistry";
import type { AgentDefinition, AgentInstance, AgentRegistryFilter } from "./AgentTypes";

export interface AgentContextValue {
  manager: AgentManager;
  registry: AgentRegistry;
  factory: AgentFactory;
  eventBus: AgentEventBus;
  definitions: AgentDefinition[];
  instances: AgentInstance[];
  activeAgentId: string | null;
  activeAgent: AgentInstance | null;
  selectAgent: (agentId: string) => void;
  clearAgentSelection: () => void;
  getAgentById: (agentId: string) => AgentInstance | undefined;
  filterDefinitions: (filter?: AgentRegistryFilter) => AgentDefinition[];
  activateAgent: (agentId: string) => Promise<boolean>;
  deactivateAgent: (agentId: string) => Promise<boolean>;
}

export const AgentContext = createContext<AgentContextValue | null>(null);
