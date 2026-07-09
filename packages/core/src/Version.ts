export interface PlatformVersion {
  platform: string;
  core: string;
  build: string;
}

export class Version {
  private readonly version: PlatformVersion;

  constructor(version: Partial<PlatformVersion> = {}) {
    this.version = {
      platform: version.platform ?? "0.1.0",
      core: version.core ?? "0.1.0",
      build: version.build ?? "foundation",
    };
  }

  getPlatform(): string {
    return this.version.platform;
  }

  getCore(): string {
    return this.version.core;
  }

  getBuild(): string {
    return this.version.build;
  }

  toString(): string {
    return `Douglas AI Platform v${this.version.platform} (core ${this.version.core})`;
  }

  snapshot(): PlatformVersion {
    return { ...this.version };
  }
}
