"use client";

import { createContext } from "react";
import type { CoreEngine } from "./CoreEngine";
import type {
  CoreEvent,
  CoreEventPayload,
  CoreHealthReport,
  CoreModuleDefinition,
  CoreModuleId,
} from "./CoreTypes";

export interface CoreContextValue {
  engine: CoreEngine;
  isReady: boolean;
  modules: CoreModuleDefinition[];
  healthReport: CoreHealthReport;
  publish: (
    topic: string,
    source: CoreModuleId | "core",
    payload?: CoreEventPayload,
  ) => CoreEvent;
  subscribe: (
    topic: string | "*",
    handler: (event: CoreEvent) => void,
  ) => () => void;
  getModule: (moduleId: CoreModuleId) => CoreModuleDefinition | undefined;
  refreshHealth: () => CoreHealthReport;
}

export const CoreContext = createContext<CoreContextValue | null>(null);
