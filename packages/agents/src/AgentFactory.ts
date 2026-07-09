import { BaseAgent, GenericAgent } from "./BaseAgent";
import type { AgentDefinition, AgentFactoryOptions } from "./AgentTypes";

export type AgentConstructor = new (definition: AgentDefinition) => BaseAgent;

const DEFAULT_TYPE_ID = "generic";

export class AgentFactory {
  private readonly constructors = new Map<string, AgentConstructor>();

  constructor() {
    this.registerType(DEFAULT_TYPE_ID, GenericAgent);
  }

  registerType(typeId: string, constructor: AgentConstructor): void {
    this.constructors.set(typeId, constructor);
  }

  unregisterType(typeId: string): boolean {
    if (typeId === DEFAULT_TYPE_ID) return false;
    return this.constructors.delete(typeId);
  }

  hasType(typeId: string): boolean {
    return this.constructors.has(typeId);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.constructors.keys());
  }

  create(
    definition: AgentDefinition,
    options: AgentFactoryOptions = {},
  ): BaseAgent {
    const typeId =
      options.typeId ??
      (typeof definition.metadata?.agentType === "string"
        ? definition.metadata.agentType
        : DEFAULT_TYPE_ID);

    const Constructor =
      this.constructors.get(typeId) ??
      this.constructors.get(DEFAULT_TYPE_ID) ??
      GenericAgent;

    return new Constructor(definition);
  }

  createMany(
    definitions: AgentDefinition[],
    options: AgentFactoryOptions = {},
  ): BaseAgent[] {
    return definitions.map((definition) => this.create(definition, options));
  }
}
