"use client";

import type { MissionExecutionPersistenceAdapterWithStatus } from "@douglas/missions";
import { createContext, useContext, type ReactNode } from "react";
import type { MissionPersistenceRemoteValidationState } from "./useMissionPersistenceRemoteValidation";
import type { StagingPersistenceAcceptanceState } from "./useStagingPersistenceAcceptance";

export interface MissionExecutionPersistenceContextValue {
  persistence: MissionExecutionPersistenceAdapterWithStatus;
  remoteValidation?: MissionPersistenceRemoteValidationState;
  stagingAcceptance?: StagingPersistenceAcceptanceState;
}

const MissionExecutionPersistenceContext =
  createContext<MissionExecutionPersistenceContextValue | null>(null);

export function MissionExecutionPersistenceProvider({
  persistence,
  remoteValidation,
  stagingAcceptance,
  children,
}: {
  persistence: MissionExecutionPersistenceAdapterWithStatus;
  remoteValidation?: MissionPersistenceRemoteValidationState;
  stagingAcceptance?: StagingPersistenceAcceptanceState;
  children: ReactNode;
}) {
  return (
    <MissionExecutionPersistenceContext.Provider
      value={{ persistence, remoteValidation, stagingAcceptance }}
    >
      {children}
    </MissionExecutionPersistenceContext.Provider>
  );
}

export function useMissionExecutionPersistenceAdapter() {
  return useContext(MissionExecutionPersistenceContext)?.persistence ?? null;
}

export function useMissionPersistenceRemoteValidationFromContext() {
  return useContext(MissionExecutionPersistenceContext)?.remoteValidation;
}

export function useStagingPersistenceAcceptanceFromContext() {
  return useContext(MissionExecutionPersistenceContext)?.stagingAcceptance;
}
