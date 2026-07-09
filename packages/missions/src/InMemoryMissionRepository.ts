import type {
  MissionData,
  MissionFilter,
  MissionInput,
} from "./MissionTypes";
import type { IMissionRepository } from "./interfaces/IMissionRepository";

function matchesFilter(mission: MissionData, filter: MissionFilter = {}): boolean {
  if (filter.status && mission.status !== filter.status) return false;
  if (filter.priority && mission.priority !== filter.priority) return false;
  if (filter.executionMode && mission.execution.mode !== filter.executionMode) {
    return false;
  }
  if (filter.scopeType || filter.scopeRefId) {
    const hasScope = mission.scopes.some((scope) => {
      if (filter.scopeType && scope.type !== filter.scopeType) return false;
      if (filter.scopeRefId && scope.refId !== filter.scopeRefId) return false;
      return true;
    });
    if (!hasScope) return false;
  }
  return true;
}

export class InMemoryMissionRepository implements IMissionRepository {
  private missions = new Map<string, MissionData>();

  create(input: MissionInput): MissionData {
    const now = new Date().toISOString();
    const mission: MissionData = {
      id: `mission:${Date.now()}:${this.missions.size}`,
      title: input.title,
      description: input.description ?? "",
      status: "draft",
      priority: input.priority ?? "normal",
      progress: { percent: 0, completedSteps: 0 },
      scopes: input.scopes ?? [],
      execution: {
        mode: input.execution?.mode ?? "manual",
        retryable: input.execution?.retryable ?? false,
        maxRetries: input.execution?.maxRetries ?? 0,
        scheduledAt: input.execution?.scheduledAt,
        executorId: input.execution?.executorId,
      },
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata ?? {},
    };

    this.missions.set(mission.id, mission);
    return mission;
  }

  get(id: string): MissionData | undefined {
    return this.missions.get(id);
  }

  update(id: string, patch: Partial<MissionData>): MissionData | undefined {
    const current = this.missions.get(id);
    if (!current) return undefined;

    const updated: MissionData = {
      ...current,
      ...patch,
      progress: patch.progress
        ? { ...current.progress, ...patch.progress }
        : current.progress,
      scopes: patch.scopes ?? current.scopes,
      execution: patch.execution
        ? { ...current.execution, ...patch.execution }
        : current.execution,
      metadata: patch.metadata
        ? { ...current.metadata, ...patch.metadata }
        : current.metadata,
      updatedAt: new Date().toISOString(),
    };

    this.missions.set(id, updated);
    return updated;
  }

  list(filter?: MissionFilter): MissionData[] {
    return Array.from(this.missions.values()).filter((mission) =>
      matchesFilter(mission, filter),
    );
  }

  remove(id: string): boolean {
    return this.missions.delete(id);
  }

  seed(missions: MissionData[]): void {
    missions.forEach((mission) => {
      this.missions.set(mission.id, mission);
    });
  }

  clear(): void {
    this.missions.clear();
  }
}
