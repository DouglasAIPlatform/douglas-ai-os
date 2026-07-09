"use client";

import { useDemoMockData } from "@/features/platform-demo-data/useDemoMockData";

export function useBrainMockState<T>(mockData: readonly T[]): T[] {
  return useDemoMockData("brain_mocks", mockData);
}
