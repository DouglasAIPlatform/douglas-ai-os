"use client";

import { useDemoData } from "@douglas/demo-data";
import {
  activities,
  agents,
  dailyMission,
  departments,
  projects,
  statistics,
} from "@/lib/mock-data";

export function useWidgetMockCatalog() {
  const { isSourceEnabled } = useDemoData();
  const enabled = isSourceEnabled("widget_mocks");

  return {
    enabled,
    projects: enabled ? projects : [],
    agents: enabled ? agents : [],
    departments: enabled ? departments : [],
    statistics: enabled ? statistics : [],
    activities: enabled ? activities : [],
    dailyMission: enabled ? dailyMission : null,
  };
}
