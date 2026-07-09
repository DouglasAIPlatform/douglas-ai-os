"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { AutomationContext } from "./AutomationContext";
import { AutomationEventBus } from "./AutomationEvent";
import { AutomationHistory } from "./AutomationHistory";
import { AutomationRegistry } from "./AutomationRegistry";
import { AutomationRunner } from "./AutomationRunner";
import { AutomationScheduler } from "./AutomationScheduler";
import type { AutomationDefinition } from "./AutomationTypes";
import type { AutomationFilter, AutomationRunFilter } from "./AutomationTypes";
import type {
  DispatchInternalEventInput,
  RunAutomationInput,
} from "./AutomationRunner";

export interface AutomationProviderProps {
  children: ReactNode;
  automations: AutomationDefinition[];
}

export function AutomationProvider({
  children,
  automations,
}: AutomationProviderProps) {
  const [activeAutomationId, setActiveAutomationId] = useState<string | null>(
    null,
  );
  const [version, setVersion] = useState(0);

  const { runner, registry, scheduler, history, eventBus } = useMemo(() => {
    const nextRegistry = new AutomationRegistry();
    const nextScheduler = new AutomationScheduler();
    const nextHistory = new AutomationHistory();
    const nextEventBus = new AutomationEventBus();
    const nextRunner = new AutomationRunner(
      nextRegistry,
      nextScheduler,
      nextHistory,
      nextEventBus,
    );

    nextRunner.bootstrap(automations);
    return {
      runner: nextRunner,
      registry: nextRegistry,
      scheduler: nextScheduler,
      history: nextHistory,
      eventBus: nextEventBus,
    };
  }, [automations]);

  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const automationList = useMemo(
    () => runner.listAutomations(),
    [runner, version],
  );

  const runs = useMemo(() => runner.listRuns(), [runner, version]);

  const scheduledJobs = useMemo(() => scheduler.list(), [scheduler, version]);

  const activeAutomation =
    automationList.find((automation) => automation.id === activeAutomationId) ??
    null;

  const listAutomations = useCallback(
    (filter?: AutomationFilter) => runner.listAutomations(filter),
    [runner],
  );

  const listRuns = useCallback(
    (filter?: AutomationRunFilter) => runner.listRuns(filter),
    [runner],
  );

  const runAutomation = useCallback(
    (input: RunAutomationInput) => {
      const run = runner.run(input);
      refresh();
      return run;
    },
    [runner, refresh],
  );

  const processScheduled = useCallback(() => {
    const results = runner.processScheduled();
    refresh();
    return results;
  }, [runner, refresh]);

  const dispatchInternalEvent = useCallback(
    (input: DispatchInternalEventInput) => {
      const results = runner.dispatchInternalEvent(input);
      refresh();
      return results;
    },
    [runner, refresh],
  );

  const getRecentHistory = useCallback(
    (limit?: number) => history.getRecent(limit),
    [history],
  );

  const value = useMemo(
    () => ({
      runner,
      registry,
      scheduler,
      history,
      eventBus,
      automations: automationList,
      runs,
      scheduledJobs,
      activeAutomationId,
      activeAutomation,
      selectAutomation: setActiveAutomationId,
      clearAutomationSelection: () => setActiveAutomationId(null),
      listAutomations,
      listRuns,
      runAutomation,
      processScheduled,
      dispatchInternalEvent,
      getRecentHistory,
    }),
    [
      activeAutomation,
      activeAutomationId,
      automationList,
      dispatchInternalEvent,
      eventBus,
      getRecentHistory,
      history,
      listAutomations,
      listRuns,
      processScheduled,
      registry,
      runAutomation,
      runner,
      runs,
      scheduledJobs,
      scheduler,
    ],
  );

  return (
    <AutomationContext.Provider value={value}>
      {children}
    </AutomationContext.Provider>
  );
}
