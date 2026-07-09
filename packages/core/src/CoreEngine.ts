import { Config } from "./Config";
import { Environment } from "./Environment";
import { EventBus } from "./EventBus";
import { HealthCheck } from "./HealthCheck";
import { Logger } from "./Logger";
import { ModuleLoader } from "./ModuleLoader";
import { ModuleRegistry } from "./ModuleRegistry";
import { createServiceToken, ServiceContainer } from "./ServiceContainer";
import { Version } from "./Version";
import { CoreServiceTokens } from "./CoreServiceTokens";
import type {
  CoreEvent,
  CoreEventPayload,
  CoreHealthReport,
  CoreModuleDefinition,
  CoreModuleId,
} from "./CoreTypes";
import { CORE_TOPICS } from "./CoreTypes";

export interface CoreEngineOptions {
  environment?: Environment;
  version?: Version;
  config?: Record<string, string | number | boolean | null>;
}

export class CoreEngine {
  readonly environment: Environment;
  readonly version: Version;
  readonly config: Config;
  readonly logger: Logger;
  readonly eventBus: EventBus;
  readonly services: ServiceContainer;
  readonly registry: ModuleRegistry;
  readonly loader: ModuleLoader;
  readonly healthCheck: HealthCheck;

  private bootstrapped = false;

  constructor(options: CoreEngineOptions = {}) {
    this.environment = options.environment ?? new Environment("development");
    this.version = options.version ?? new Version();
    this.config = new Config();
    this.logger = new Logger(200, this.environment.isDebug() ? "debug" : "info");
    this.eventBus = new EventBus();
    this.services = new ServiceContainer();
    this.registry = new ModuleRegistry();
    this.loader = new ModuleLoader(this.registry, this.eventBus, this.logger);
    this.healthCheck = new HealthCheck(this.registry);

    if (options.config) {
      this.config.merge(options.config);
    }

    this.registerCoreServices();
  }

  bootstrap(modules: CoreModuleDefinition[]): CoreHealthReport {
    this.logger.info("Bootstrapping Douglas Core", {
      moduleCount: modules.length,
    });

    modules.forEach((module) => {
      this.eventBus.publish(CORE_TOPICS.MODULE_REGISTERED, "core", {
        moduleId: module.id,
        version: module.version,
      });
    });

    this.loader.loadAll(modules);
    this.bootstrapped = true;

    this.eventBus.publish(CORE_TOPICS.PLATFORM_READY, "core", {
      platformVersion: this.version.getPlatform(),
      coreVersion: this.version.getCore(),
      moduleCount: this.registry.size(),
    });

    const report = this.healthCheck.run();
    this.eventBus.publish(CORE_TOPICS.HEALTH_CHECK, "core", {
      status: report.status,
    });

    this.logger.info("Douglas Core ready", { status: report.status });
    return report;
  }

  publish(
    topic: string,
    source: CoreModuleId | "core",
    payload: CoreEventPayload = {},
  ): CoreEvent {
    return this.eventBus.publish(topic, source, payload);
  }

  subscribe(
    topic: string | "*",
    handler: (event: CoreEvent) => void,
  ): () => void {
    return this.eventBus.subscribe(topic, handler);
  }

  getModule(moduleId: CoreModuleId): CoreModuleDefinition | undefined {
    return this.registry.get(moduleId);
  }

  isReady(): boolean {
    return this.bootstrapped;
  }

  getHealthReport(): CoreHealthReport {
    return this.healthCheck.run();
  }

  private registerCoreServices(): void {
    this.services.register(CoreServiceTokens.eventBus, () => this.eventBus);
    this.services.register(CoreServiceTokens.logger, () => this.logger);
    this.services.register(CoreServiceTokens.config, () => this.config);
    this.services.register(CoreServiceTokens.registry, () => this.registry);
    this.services.register(CoreServiceTokens.version, () => this.version);
    this.services.register(CoreServiceTokens.environment, () => this.environment);
  }
}
