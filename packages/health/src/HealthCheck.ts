import type { HealthCheckDefinition, HealthModuleResult } from "./HealthTypes";
import { createHealthIssue } from "./HealthIssue";

export class HealthCheck {
  async run(definition: HealthCheckDefinition): Promise<HealthModuleResult> {
    const checkedAt = new Date().toISOString();

    try {
      const result = await definition.check();
      return {
        ...result,
        moduleId: result.moduleId || definition.id,
        moduleName: result.moduleName || definition.name,
        lastCheckedAt: result.lastCheckedAt || checkedAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Health check failed.";

      return {
        moduleId: definition.id,
        moduleName: definition.name,
        status: "critical",
        message,
        lastCheckedAt: checkedAt,
        uptimeMs: 0,
        issues: [createHealthIssue(definition.id, "critical", message)],
        recommendations: [],
        metadata: {},
      };
    }
  }

  async runAll(definitions: HealthCheckDefinition[]): Promise<HealthModuleResult[]> {
    const results: HealthModuleResult[] = [];

    for (const definition of definitions) {
      results.push(await this.run(definition));
    }

    return results;
  }
}
