"use client";

import { useDemoData, type DemoDataSource } from "@douglas/demo-data";
import { useMemo } from "react";

export function useDemoMockData<T>(
  source: DemoDataSource,
  mockData: readonly T[],
): T[] {
  const { isSourceEnabled } = useDemoData();

  return useMemo(
    () => (isSourceEnabled(source) ? [...mockData] : []),
    [isSourceEnabled, mockData, source],
  );
}
