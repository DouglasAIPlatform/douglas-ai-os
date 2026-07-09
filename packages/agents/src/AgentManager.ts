import { AgentEventBus, createAgentEvent } from "./AgentEvents";
import { AgentFactory } from "./AgentFactory";
import { AgentRegistry } from "./AgentRegistry";
import type { BaseAgent } from "./BaseAgent";
import type {
  AgentDefinition,
  AgentInstance,
  AgentLifecycleHooks,
  AgentRegistryFilter,
} from "./AgentTypes";

export class AgentManager {
  private readonly instances = new Map<string, BaseAgent>();
  private readonly eventBus: AgentEventBus;
  private readonly hooks: AgentLifecycleHooks;

  constructor(
    private readonly registry: AgentRegistry,
    private readonly factory: AgentFactory,
    options: {
      eventBus?: AgentEventBus;
      hooks?: AgentLifecycleHooks;
    } = {},
  ) {
    this.eventBus = options.eventBus ?? new AgentEventBus();
    this.hooks = options.hooks ?? {};
  }

  getEventBus(): AgentEventBus {
    return this.eventBus;
  }

  getRegistry(): AgentRegistry {
    return this.registry;
  }

  getFactory(): AgentFactory {
    return this.factory;
  }

  bootstrap(definitions: AgentDefinition[]): void {
    this.registry.registerMany(definitions);
    definitions.forEach((definition) => {
      if (!this.instances.has(definition.id)) {
        this.instances.set(definition.id, this.factory.create(definition));
      }
    });
  }

  registerDefinition(definition: AgentDefinition): BaseAgent {
    this.registry.register(definition);

    if (this.instances.has(definition.id)) {
      return this.instances.get(definition.id)!;
    }

    const instance = this.factory.create(definition);
    this.instances.set(definition.id, instance);
    return instance;
  }

  unregister(agentId: string): boolean {
    const removedFromRegistry = this.registry.unregister(agentId);
    this.instances.delete(agentId);
    return removedFromRegistry;
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.instances.get(agentId);
  }

  getOrCreate(agentId: string): BaseAgent | undefined {
    const existing = this.instances.get(agentId);
    if (existing) return existing;

    const definition = this.registry.get(agentId);
    if (!definition) return undefined;

    const instance = this.factory.create(definition);
    this.instances.set(agentId, instance);
    return instance;
  }

  listDefinitions(filter?: AgentRegistryFilter): AgentDefinition[] {
    return filter ? this.registry.filter(filter) : this.registry.getAll();
  }

  listInstances(filter?: AgentRegistryFilter): AgentInstance[] {
    const definitions = this.listDefinitions(filter);
    const definitionIds = new Set(definitions.map((definition) => definition.id));

    return Array.from(this.instances.values())
      .filter((agent) => definitionIds.has(agent.id))
      .map((agent) => agent.getSnapshot());
  }

  async activate(agentId: string): Promise<boolean> {
    const agent = this.getOrCreate(agentId);
    if (!agent) return false;

    await agent.activate();
    await this.hooks.onActivate?.(agentId);
    this.eventBus.emit(createAgentEvent("agent:activated", agentId));
    return true;
  }

  async deactivate(agentId: string): Promise<boolean> {
    const agent = this.getAgent(agentId);
    if (!agent) return false;

    await agent.deactivate();
    await this.hooks.onDeactivate?.(agentId);
    this.eventBus.emit(createAgentEvent("agent:deactivated", agentId));
    return true;
  }

  count(): number {
    return this.instances.size;
  }
}
