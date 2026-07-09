import { createContext } from "react";
import type { PlatformStateFacade } from "./PlatformStateFacade";
import type { PlatformSnapshot } from "./PlatformStateTypes";

export interface PlatformStateContextValue {
  facade: PlatformStateFacade;
  snapshot: PlatformSnapshot;
}

export const PlatformStateContext = createContext<PlatformStateContextValue | null>(null);
