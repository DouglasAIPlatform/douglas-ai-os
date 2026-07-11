"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import type { MissionExecutionCoordinator } from "./execution/MissionExecutionCoordinator";
import { MissionManager } from "./MissionManager";
import { MissionControlContext } from "./MissionControlContext";
import type { MissionData } from "./MissionTypes";

export interface MissionProviderProps {
  children: ReactNode;
  seedMissions?: MissionData[];
  manager?: MissionManager;
  coordinator?: MissionExecutionCoordinator;
}

export function MissionProvider({
  children,
  seedMissions = [],
  manager: externalManager,
  coordinator,
}: MissionProviderProps) {
  const [manager] = useState(() => {
    const nextManager = externalManager ?? new MissionManager();
    if (seedMissions.length) nextManager.getRepository().seed(seedMissions);
    return nextManager;
  });

  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => {
    setRevision((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({
      manager,
      coordinator,
      board: manager.board.build(),
      missions: manager.list(),
      getMission: (id: string) => manager.get(id),
      getTimeline: (missionId: string) => manager.getTimeline().getByMissionId(missionId),
      getHistory: (missionId: string) => manager.getHistory().getByMissionId(missionId),
      refresh,
    }),
    [manager, coordinator, refresh, revision],
  );

  return (
    <MissionControlContext.Provider value={value}>
      {children}
    </MissionControlContext.Provider>
  );
}
