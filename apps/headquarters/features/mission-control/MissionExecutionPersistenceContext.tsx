"use client";

import type { MissionExecutionPersistenceAdapterWithStatus } from "@douglas/missions";
import { createContext, useContext, type ReactNode } from "react";

const MissionExecutionPersistenceContext =
  createContext<MissionExecutionPersistenceAdapterWithStatus | null>(null);

export function MissionExecutionPersistenceProvider({
  persistence,
  children,
}: {
  persistence: MissionExecutionPersistenceAdapterWithStatus;
  children: ReactNode;
}) {
  return (
    <MissionExecutionPersistenceContext.Provider value={persistence}>
      {children}
    </MissionExecutionPersistenceContext.Provider>
  );
}

export function useMissionExecutionPersistenceAdapter() {
  return useContext(MissionExecutionPersistenceContext);
}
