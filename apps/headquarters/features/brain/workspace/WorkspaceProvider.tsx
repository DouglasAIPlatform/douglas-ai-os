"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { mockWorkspaces } from "../mocks";
import { useBrainMockState } from "../useBrainMockState";
import { WorkspaceContext } from "./WorkspaceContext";

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const workspaces = useBrainMockState(mockWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    () => workspaces[0]?.id ?? null,
  );

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;

  function getWorkspaceById(workspaceId: string) {
    return workspaces.find((workspace) => workspace.id === workspaceId);
  }

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      selectWorkspace: setActiveWorkspaceId,
      clearWorkspaceSelection: () => setActiveWorkspaceId(null),
      getWorkspaceById,
    }),
    [activeWorkspace, activeWorkspaceId, workspaces],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}
