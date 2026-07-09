"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { DepartmentManager } from "./DepartmentManager";
import { DepartmentSystemContext } from "./DepartmentSystemContext";
import type { DepartmentDefinition } from "./DepartmentTypes";
import type { DepartmentSeedData } from "./DepartmentSeedTypes";

export interface DepartmentProviderProps {
  children: ReactNode;
  departments?: DepartmentDefinition[];
  seedData?: DepartmentSeedData;
  manager?: DepartmentManager;
}

function applySeedData(
  manager: DepartmentManager,
  seedData: DepartmentSeedData,
): void {
  seedData.agentRegistrations?.forEach(({ departmentId, agentId }) => {
    manager.registerAgent(departmentId, agentId);
  });

  seedData.tasks?.forEach(({ departmentId, task }) => {
    manager.receiveTask(departmentId, task);
  });

  seedData.events?.forEach(({ departmentId, topic, payload }) => {
    manager.publishEvent(departmentId, topic, payload);
  });

  seedData.metrics?.forEach(({ departmentId, key, label, value }) => {
    manager.emitMetric(departmentId, key, label, value);
  });
}

export function DepartmentProvider({
  children,
  departments = [],
  seedData,
  manager: externalManager,
}: DepartmentProviderProps) {
  const [manager] = useState(() => {
    const nextManager = externalManager ?? new DepartmentManager();
    if (departments.length) nextManager.registerDepartments(departments);
    if (seedData) applySeedData(nextManager, seedData);
    return nextManager;
  });

  const value = useMemo(
    () => ({
      manager,
      departments: manager.getAllDepartments(),
      healthReports: manager.reportAllHealth(),
      metricsSnapshots: manager.getAllMetricsSnapshots(),
      getContext: (departmentId: DepartmentDefinition["id"]) =>
        manager.getContext(departmentId),
      getHealth: (departmentId: DepartmentDefinition["id"]) =>
        manager.reportHealth(departmentId),
    }),
    [manager],
  );

  return (
    <DepartmentSystemContext.Provider value={value}>
      {children}
    </DepartmentSystemContext.Provider>
  );
}
