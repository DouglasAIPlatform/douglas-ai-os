"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { AgentContext } from "./AgentContext";
import { AgentEventBus } from "./AgentEvents";
import { AgentFactory } from "./AgentFactory";
import { AgentManager } from "./AgentManager";
import { AgentRegistry } from "./AgentRegistry";
import type {
  AgentDefinition,
  AgentInstance,
  AgentLifecycleHooks,
  AgentRegistryFilter,
} from "./AgentTypes";

export interface AgentProviderProps {
  children: ReactNode;
  definitions: AgentDefinition[];
  hooks?: AgentLifecycleHooks;
}

export function AgentProvider({
  children,
  definitions,
  hooks,
}: AgentProviderProps) {
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const { manager, registry, factory, eventBus } = useMemo(() => {
    const nextRegistry = new AgentRegistry();
    const nextFactory = new AgentFactory();
    const nextEventBus = new AgentEventBus();
    const nextManager = new AgentManager(nextRegistry, nextFactory, {
      eventBus: nextEventBus,
      hooks,
    });

    nextManager.bootstrap(definitions);

    return {
      manager: nextManager,
      registry: nextRegistry,
      factory: nextFactory,
      eventBus: nextEventBus,
    };
  }, [definitions, hooks]);

  const instances = useMemo(
    () => manager.listInstances(),
    [manager, version],
  );

  const activeAgent =
    instances.find((instance) => instance.id === activeAgentId) ?? null;

  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const getAgentById = useCallback(
    (agentId: string): AgentInstance | undefined => {
      return manager.getAgent(agentId)?.getSnapshot();
    },
    [manager],
  );

  const filterDefinitions = useCallback(
    (filter?: AgentRegistryFilter): AgentDefinition[] => {
      return manager.listDefinitions(filter);
    },
    [manager],
  );

  const activateAgent = useCallback(
    async (agentId: string) => {
      const result = await manager.activate(agentId);
      refresh();
      return result;
    },
    [manager, refresh],
  );

  const deactivateAgent = useCallback(
    async (agentId: string) => {
      const result = await manager.deactivate(agentId);
      refresh();
      return result;
    },
    [manager, refresh],
  );

  const value = useMemo(
    () => ({
      manager,
      registry,
      factory,
      eventBus,
      definitions: registry.getAll(),
      instances,
      activeAgentId,
      activeAgent,
      selectAgent: setActiveAgentId,
      clearAgentSelection: () => setActiveAgentId(null),
      getAgentById,
      filterDefinitions,
      activateAgent,
      deactivateAgent,
    }),
    [
      activateAgent,
      activeAgent,
      activeAgentId,
      deactivateAgent,
      eventBus,
      factory,
      filterDefinitions,
      getAgentById,
      instances,
      manager,
      registry,
    ],
  );

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}
