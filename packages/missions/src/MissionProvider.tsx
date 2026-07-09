"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { MissionManager } from "./MissionManager";
import { MissionControlContext } from "./MissionControlContext";
import type { MissionData } from "./MissionTypes";

export interface MissionProviderProps {
  children: ReactNode;
  seedMissions?: MissionData[];
  manager?: MissionManager;
}

export function MissionProvider({
  children,
  seedMissions = [],
  manager: externalManager,
}: MissionProviderProps) {
  const [manager] = useState(() => {
    const nextManager = externalManager ?? new MissionManager();
    if (seedMissions.length) nextManager.getRepository().seed(seedMissions);
    return nextManager;
  });

  const value = useMemo(
    () => ({
      manager,
      board: manager.board.build(),
      missions: manager.list(),
      getMission: (id: string) => manager.get(id),
      getTimeline: (missionId: string) => manager.getTimeline().getByMissionId(missionId),
      getHistory: (missionId: string) => manager.getHistory().getByMissionId(missionId),
    }),
    [manager],
  );

  return (
    <MissionControlContext.Provider value={value}>
      {children}
    </MissionControlContext.Provider>
  );
}
