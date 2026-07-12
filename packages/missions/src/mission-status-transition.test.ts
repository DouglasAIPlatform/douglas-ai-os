import { describe, expect, it } from "vitest";
import { MissionManager } from "./MissionManager";
import {
  evaluateMissionStatusTransition,
  VALID_MISSION_BOARD_TRANSITIONS,
} from "./MissionStatusTransitionPolicy";

describe("MissionStatusTransitionPolicy", () => {
  it("retorna noop para active → active", () => {
    const result = evaluateMissionStatusTransition("active", "active");
    expect(result.decision).toBe("noop");
  });

  it("retorna noop para completed → completed", () => {
    const result = evaluateMissionStatusTransition("completed", "completed");
    expect(result.decision).toBe("noop");
  });

  it("retorna noop para planned → planned", () => {
    expect(evaluateMissionStatusTransition("planned", "planned").decision).toBe("noop");
  });

  it("permite transições válidas do board", () => {
    expect(evaluateMissionStatusTransition("draft", "planned").decision).toBe("apply");
    expect(evaluateMissionStatusTransition("planned", "active").decision).toBe("apply");
    expect(evaluateMissionStatusTransition("active", "blocked").decision).toBe("apply");
    expect(evaluateMissionStatusTransition("active", "completed").decision).toBe("apply");
    expect(evaluateMissionStatusTransition("blocked", "active").decision).toBe("apply");
    expect(evaluateMissionStatusTransition("blocked", "completed").decision).toBe("apply");
  });

  it("rejeita regressões inválidas", () => {
    expect(evaluateMissionStatusTransition("completed", "active").decision).toBe("reject");
    expect(evaluateMissionStatusTransition("planned", "completed").decision).toBe("reject");
  });

  it("MissionManager não registra timeline em no-op", () => {
    const manager = new MissionManager();
    const mission = manager.create({ title: "No-op test" });
    manager.transition(mission.id, "planned");
    manager.transition(mission.id, "active");

    const beforeCount = manager.getTimeline().getByMissionId(mission.id).length;
    manager.transition(mission.id, "active");
    manager.transition(mission.id, "active");
    const afterCount = manager.getTimeline().getByMissionId(mission.id).length;

    expect(afterCount).toBe(beforeCount);
  });

  it("transição válida gera exatamente uma entrada de timeline", () => {
    const manager = new MissionManager();
    const mission = manager.create({ title: "Transition test" });
    manager.transition(mission.id, "planned");

    const before = manager.getTimeline().getByMissionId(mission.id).length;
    manager.transition(mission.id, "active");
    const after = manager.getTimeline().getByMissionId(mission.id).length;

    expect(after - before).toBe(1);
  });

  it("expõe matriz de transições válidas", () => {
    expect(VALID_MISSION_BOARD_TRANSITIONS.planned).toContain("active");
    expect(VALID_MISSION_BOARD_TRANSITIONS.active).toContain("completed");
  });
});
