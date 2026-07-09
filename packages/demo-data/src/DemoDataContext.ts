"use client";

import { createContext } from "react";
import type { DemoDataConfig } from "./DemoDataConfig";
import type { DemoDataPolicy } from "./DemoDataPolicy";
import type { DemoDataSource } from "./DemoDataSource";

export interface DemoDataContextValue {
  config: DemoDataConfig;
  policy: DemoDataPolicy;
  isSourceEnabled: (source: DemoDataSource) => boolean;
}

export const DemoDataContext = createContext<DemoDataContextValue | null>(null);
