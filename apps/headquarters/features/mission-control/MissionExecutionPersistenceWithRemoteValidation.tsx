"use client";

import type { MissionExecutionPersistenceAdapterWithStatus } from "@douglas/missions";
import type { ReactNode } from "react";
import {
  MissionExecutionPersistenceProvider,
  useMissionExecutionPersistenceAdapter,
} from "./MissionExecutionPersistenceContext";
import { useMissionPersistenceRemoteValidation } from "./useMissionPersistenceRemoteValidation";
import { useStagingPersistenceAcceptance } from "./useStagingPersistenceAcceptance";

export function MissionExecutionStagingAcceptanceBridge({
  children,
}: {
  children: ReactNode;
}) {
  const persistence = useMissionExecutionPersistenceAdapter();
  const remoteValidation = useMissionPersistenceRemoteValidation(persistence);
  const stagingAcceptance = useStagingPersistenceAcceptance(persistence);

  if (!persistence) {
    return children;
  }

  return (
    <MissionExecutionPersistenceProvider
      persistence={persistence}
      remoteValidation={remoteValidation}
      stagingAcceptance={stagingAcceptance}
    >
      {children}
    </MissionExecutionPersistenceProvider>
  );
}

export function MissionExecutionPersistenceWithRemoteValidation({
  persistence,
  children,
}: {
  persistence: MissionExecutionPersistenceAdapterWithStatus;
  children: ReactNode;
}) {
  return (
    <MissionExecutionPersistenceProvider persistence={persistence}>
      {children}
    </MissionExecutionPersistenceProvider>
  );
}
