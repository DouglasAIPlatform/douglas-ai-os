"use client";

import { createContext } from "react";
import type { RuntimeControlPanel } from "./RuntimeControlPanel";
import type { RuntimeControlService } from "./RuntimeControlService";
import type { RuntimeActionResult, RuntimeCommand } from "./RuntimeControlTypes";
import type { RuntimeModuleSnapshot } from "./RuntimeTypes";

export interface RuntimeControlContextValue {
  service: RuntimeControlService;
  panel: RuntimeControlPanel;
  modules: RuntimeModuleSnapshot[];
  lastCommand: RuntimeCommand | null;
  lastResult: RuntimeActionResult | null;
  executeAction: (
    moduleId: string,
    action: import("./RuntimeControlTypes").RuntimeActionType,
  ) => Promise<RuntimeActionResult>;
  isExecuting: boolean;
}

export const RuntimeControlContext = createContext<RuntimeControlContextValue | null>(null);
