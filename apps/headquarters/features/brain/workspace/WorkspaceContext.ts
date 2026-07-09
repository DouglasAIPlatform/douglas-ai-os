"use client";

import { createContext } from "react";
import type { Workspace } from "../types";

export interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  selectWorkspace: (workspaceId: string) => void;
  clearWorkspaceSelection: () => void;
  getWorkspaceById: (workspaceId: string) => Workspace | undefined;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
