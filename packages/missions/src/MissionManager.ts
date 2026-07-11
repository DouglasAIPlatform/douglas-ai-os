import { InMemoryMissionRepository } from "./InMemoryMissionRepository";
import { MissionBoard } from "./MissionBoard";
import { MissionHistory } from "./MissionHistory";
import { MissionProgress } from "./MissionProgress";
import { MissionTimeline } from "./MissionTimeline";
import type {
  MissionData,
  MissionFilter,
  MissionInput,
  MissionProgressState,
  MissionScope,
  MissionStatus,
} from "./MissionTypes";
import type { IMissionBoard } from "./interfaces/IMissionManager";
import type { IMissionHistory } from "./interfaces/IMissionHistory";
import type { IMissionManager } from "./interfaces/IMissionManager";
import type { IMissionProgress } from "./interfaces/IMissionProgress";
import type { IMissionRepository } from "./interfaces/IMissionRepository";
import type { IMissionTimeline } from "./interfaces/IMissionTimeline";

export interface MissionManagerOptions {
  repository?: IMissionRepository;
  progress?: IMissionProgress;
  timeline?: IMissionTimeline;
  history?: IMissionHistory;
  board?: IMissionBoard;
}

export class MissionManager implements IMissionManager {
  private readonly repository: IMissionRepository;
  private readonly progress: IMissionProgress;
  private readonly timeline: IMissionTimeline;
  private readonly history: IMissionHistory;
  readonly board: IMissionBoard;

  constructor(options: MissionManagerOptions = {}) {
    this.repository = options.repository ?? new InMemoryMissionRepository();
    this.progress = options.progress ?? new MissionProgress();
    this.timeline = options.timeline ?? new MissionTimeline();
    this.history = options.history ?? new MissionHistory();
    this.board = options.board ?? new MissionBoard(this.repository);
  }

  create(input: MissionInput): MissionData {
    const mission = this.repository.create(input);
    this.history.record("created", mission);
    this.timeline.record(mission.id, "created", "Missão criada", mission.title);
    return mission;
  }

  get(id: string): MissionData | undefined {
    return this.repository.get(id);
  }

  list(filter?: MissionFilter): MissionData[] {
    return this.repository.list(filter);
  }

  updateProgress(
    id: string,
    patch: Partial<MissionProgressState>,
  ): MissionData | undefined {
    const current = this.repository.get(id);
    if (!current) return undefined;

    const nextProgress = this.progress.update(current.progress, patch);
    const updated = this.repository.update(id, { progress: nextProgress });
    if (!updated) return undefined;

    this.history.record("progress_updated", updated);
    this.timeline.record(
      id,
      "progress_update",
      "Progresso atualizado",
      `${nextProgress.percent}%`,
    );
    return updated;
  }

  linkScope(id: string, scope: MissionScope): MissionData | undefined {
    const current = this.repository.get(id);
    if (!current) return undefined;

    const exists = current.scopes.some(
      (entry) => entry.type === scope.type && entry.refId === scope.refId,
    );
    if (exists) return current;

    const updated = this.repository.update(id, {
      scopes: [...current.scopes, scope],
    });
    if (!updated) return undefined;

    this.timeline.record(
      id,
      "scope_linked",
      "Escopo vinculado",
      `${scope.type}:${scope.refId}`,
    );
    this.history.record("updated", updated);
    return updated;
  }

  transition(id: string, status: MissionStatus): MissionData | undefined {
    const current = this.repository.get(id);
    if (!current) return undefined;

    const updated = this.repository.update(id, { status });
    if (!updated) return undefined;

    this.timeline.record(
      id,
      "status_change",
      "Status alterado",
      `${current.status} → ${status}`,
    );
    this.history.record("updated", updated);
    return updated;
  }

  start(id: string): MissionData | undefined {
    const updated = this.repository.update(id, {
      status: "active",
      startedAt: new Date().toISOString(),
    });
    if (!updated) return undefined;

    this.history.record("started", updated);
    this.timeline.record(id, "status_change", "Missão iniciada");
    return updated;
  }

  complete(id: string): MissionData | undefined {
    const current = this.repository.get(id);
    if (!current) return undefined;

    const nextProgress = this.progress.update(current.progress, { percent: 100 });
    const updated = this.repository.update(id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      progress: nextProgress,
    });
    if (!updated) return undefined;

    this.history.record("completed", updated);
    this.timeline.record(id, "status_change", "Missão concluída");
    return updated;
  }

  block(id: string, reason?: string): MissionData | undefined {
    const updated = this.transition(id, "blocked");
    if (updated && reason) {
      this.timeline.record(id, "note", "Missão bloqueada", reason);
      this.history.record("blocked", updated);
    }
    return updated;
  }

  fail(id: string, reason?: string): MissionData | undefined {
    const updated = this.transition(id, "failed");
    if (updated) {
      if (reason) {
        this.timeline.record(id, "note", "Missão falhou", reason);
      }
      this.history.record("failed", updated);
    }
    return updated;
  }

  archive(id: string): MissionData | undefined {
    const updated = this.transition(id, "archived");
    if (updated) this.history.record("archived", updated);
    return updated;
  }

  getRepository(): IMissionRepository {
    return this.repository;
  }

  getTimeline(): IMissionTimeline {
    return this.timeline;
  }

  getHistory(): IMissionHistory {
    return this.history;
  }

  listAutomaticPlanned(): MissionData[] {
    return this.repository.list({ executionMode: "automatic", status: "planned" });
  }
}
