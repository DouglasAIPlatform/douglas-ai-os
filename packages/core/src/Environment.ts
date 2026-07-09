import type { CoreEnvironmentName } from "./CoreTypes";

export interface EnvironmentConfig {
  name: CoreEnvironmentName;
  debug: boolean;
  apiBaseUrl: string;
}

const defaults: Record<CoreEnvironmentName, EnvironmentConfig> = {
  development: {
    name: "development",
    debug: true,
    apiBaseUrl: "http://localhost:3000",
  },
  staging: {
    name: "staging",
    debug: true,
    apiBaseUrl: "https://staging.douglas.ai",
  },
  production: {
    name: "production",
    debug: false,
    apiBaseUrl: "https://douglas.ai",
  },
};

export class Environment {
  private readonly config: EnvironmentConfig;

  constructor(name: CoreEnvironmentName = "development") {
    this.config = defaults[name];
  }

  getName(): CoreEnvironmentName {
    return this.config.name;
  }

  isDebug(): boolean {
    return this.config.debug;
  }

  getApiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }
}
