import { Config } from "./Config";
import { Environment } from "./Environment";
import { EventBus } from "./EventBus";
import { Logger } from "./Logger";
import { ModuleRegistry } from "./ModuleRegistry";
import { createServiceToken } from "./ServiceContainer";
import { Version } from "./Version";

export const CoreServiceTokens = {
  eventBus: createServiceToken<EventBus>("core.eventBus"),
  logger: createServiceToken<Logger>("core.logger"),
  config: createServiceToken<Config>("core.config"),
  registry: createServiceToken<ModuleRegistry>("core.registry"),
  version: createServiceToken<Version>("core.version"),
  environment: createServiceToken<Environment>("core.environment"),
};
