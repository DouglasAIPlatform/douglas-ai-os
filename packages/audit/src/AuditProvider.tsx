"use client";

import { useEventBus } from "@douglas/events";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuditContext } from "./AuditContext";
import { createAuditMapperState, isAuditedEventTopic, mapEventToAuditEntries } from "./AuditEventMapper";
import type { AuditIngestMetric } from "./AuditIngestMetric";
import {
  type AuditIngestObservabilitySnapshot,
} from "./AuditIngestObservabilitySnapshot";
import {
  AuditIngestObservabilityStore,
  getAuditIngestObservabilityStore,
} from "./AuditIngestObservabilityStore";
import { metricToTelemetryPayload } from "./AuditIngestTelemetry";
import {
  outcomeToTelemetryTopic,
} from "./AuditIngestTelemetryPolicy";
import { AuditLog, createAuditLog, type AuditLogOptions } from "./AuditLog";
import type { AuditPersistenceConfig } from "./AuditPersistenceConfig";
import type { AuditPersistenceMode } from "./AuditPersistenceMode";
import { DEFAULT_AUDIT_PERSISTENCE_STATUS } from "./AuditPersistenceStatus";
import {
  CompositeAuditPersistenceAdapter,
  createCompositeAuditPersistenceAdapter,
  isAuditPersistenceAdapterWithStatus,
  readAuditPersistenceStatus,
} from "./CompositeAuditPersistenceAdapter";
import type { SupabaseAuditPersistenceConfig } from "./SupabaseAuditPersistenceConfig";

export interface AuditPersistenceIntegrationConfig {
  mode?: AuditPersistenceMode;
  localStorage?: Partial<AuditPersistenceConfig>;
  supabase?: Partial<SupabaseAuditPersistenceConfig>;
  supabaseClient?: SupabaseClient | null;
  isSupabaseConfigured?: boolean;
}

export interface AuditProviderProps {
  children: ReactNode;
  auditLog?: AuditLog;
  displayLimit?: number;
  logOptions?: AuditLogOptions;
  /** @deprecated Use persistenceIntegration */
  persistenceConfig?: Partial<AuditPersistenceConfig>;
  persistenceIntegration?: AuditPersistenceIntegrationConfig;
}

function createPersistenceAdapter(
  integration?: AuditPersistenceIntegrationConfig,
  legacyConfig?: Partial<AuditPersistenceConfig>,
  options?: {
    ingestObservability?: AuditIngestObservabilityStore;
    onIngestMetric?: (metric: AuditIngestMetric) => void;
  },
): CompositeAuditPersistenceAdapter {
  return createCompositeAuditPersistenceAdapter(integration?.supabaseClient ?? null, {
    mode: integration?.mode ?? "auto",
    isSupabaseConfigured: integration?.isSupabaseConfigured ?? false,
    localStorage: integration?.localStorage ?? legacyConfig,
    supabase: integration?.supabase,
    ingestObservability: options?.ingestObservability,
    onIngestMetric: options?.onIngestMetric,
  });
}

function createDefaultAuditLog(
  integration?: AuditPersistenceIntegrationConfig,
  legacyConfig?: Partial<AuditPersistenceConfig>,
  options?: {
    ingestObservability?: AuditIngestObservabilityStore;
    onIngestMetric?: (metric: AuditIngestMetric) => void;
  },
): { log: AuditLog; adapter: CompositeAuditPersistenceAdapter } {
  const adapter = createPersistenceAdapter(integration, legacyConfig, options);
  const maxEntries =
    integration?.localStorage?.maxEntries ??
    legacyConfig?.maxEntries ??
    200;

  const log = createAuditLog({
    persistence: adapter,
    storeOptions: { capacity: maxEntries },
  });

  log.hydrate(adapter.hydrate());

  return { log, adapter };
}

export function AuditProvider({
  children,
  auditLog: externalAuditLog,
  displayLimit = 50,
  persistenceConfig,
  persistenceIntegration,
}: AuditProviderProps) {
  const { subscribeAll, publish } = useEventBus();
  const ingestObservabilityStore = useMemo(() => getAuditIngestObservabilityStore(), []);
  const [ingestObservability, setIngestObservability] =
    useState<AuditIngestObservabilitySnapshot>(() => ingestObservabilityStore.getSnapshot());

  const publishIngestMetricRef = useRef<(metric: AuditIngestMetric) => void>(() => {});
  publishIngestMetricRef.current = (metric: AuditIngestMetric) => {
    publish(outcomeToTelemetryTopic(metric.outcome), "audit", metricToTelemetryPayload(metric));
  };

  const onIngestMetric = useCallback((metric: AuditIngestMetric) => {
    publishIngestMetricRef.current(metric);
  }, []);

  const [{ log: defaultLog, adapter }] = useState(() =>
    externalAuditLog
      ? {
          log: externalAuditLog,
          adapter: createPersistenceAdapter(persistenceIntegration, persistenceConfig, {
            ingestObservability: ingestObservabilityStore,
            onIngestMetric,
          }),
        }
      : createDefaultAuditLog(persistenceIntegration, persistenceConfig, {
          ingestObservability: ingestObservabilityStore,
          onIngestMetric,
        }),
  );
  const auditLog = externalAuditLog ?? defaultLog;
  const [version, setVersion] = useState(0);
  const [persistenceStatus, setPersistenceStatus] = useState(
    readAuditPersistenceStatus(adapter) ?? DEFAULT_AUDIT_PERSISTENCE_STATUS,
  );
  const mapperStateRef = useRef(createAuditMapperState());
  const initializedRef = useRef(false);

  useEffect(() => {
    return ingestObservabilityStore.subscribe((snapshot) => {
      setIngestObservability(snapshot);
    });
  }, [ingestObservabilityStore]);

  useEffect(() => {
    if (initializedRef.current || !isAuditPersistenceAdapterWithStatus(adapter)) {
      return;
    }

    initializedRef.current = true;

    void (async () => {
      if (adapter.initialize) {
        await adapter.initialize();
      }

      const remoteEntries = await adapter.hydrateRemote();
      if (remoteEntries.length) {
        auditLog.hydrate(remoteEntries);
      }

      setPersistenceStatus(adapter.getStatus());
    })();
  }, [adapter, auditLog]);

  useEffect(() => {
    if (!adapter.onStatusChange) {
      return;
    }

    return adapter.onStatusChange(() => {
      setPersistenceStatus(adapter.getStatus());
    });
  }, [adapter]);

  useEffect(() => {
    return auditLog.subscribe(() => {
      setVersion((current) => current + 1);
      setPersistenceStatus(readAuditPersistenceStatus(adapter));
    });
  }, [adapter, auditLog]);

  useEffect(() => {
    return subscribeAll((event) => {
      if (!isAuditedEventTopic(event.topic)) return;

      const mapped = mapEventToAuditEntries(event, mapperStateRef.current);
      mapperStateRef.current = mapped.state;

      mapped.entries.forEach((entry) => {
        auditLog.record(entry);
      });
    });
  }, [auditLog, subscribeAll]);

  const entries = useMemo(() => {
    void version;
    return auditLog.getRecent(displayLimit);
  }, [auditLog, displayLimit, version]);

  const retryPendingEntries = useMemo(() => {
    if (!adapter.retryPendingEntries) {
      return undefined;
    }

    return () => adapter.retryPendingEntries!().then((result) => {
      setPersistenceStatus(adapter.getStatus());
      return result;
    });
  }, [adapter]);

  const clearResolvedPendingEntries = useMemo(() => {
    if (!adapter.clearResolvedPendingEntries) {
      return undefined;
    }

    return () => {
      const result = adapter.clearResolvedPendingEntries!();
      setPersistenceStatus(adapter.getStatus());
      return result;
    };
  }, [adapter]);

  const clearStaleFailedPendingEntries = useMemo(() => {
    if (!adapter.clearStaleFailedPendingEntries) {
      return undefined;
    }

    return () => {
      const result = adapter.clearStaleFailedPendingEntries!();
      setPersistenceStatus(adapter.getStatus());
      return result;
    };
  }, [adapter]);

  const value = useMemo(
    () => ({
      auditLog,
      entries,
      totalCount: auditLog.getCount(),
      persistenceStatus,
      retryPendingEntries,
      clearResolvedPendingEntries,
      clearStaleFailedPendingEntries,
      ingestObservability,
    }),
    [
      auditLog,
      entries,
      persistenceStatus,
      retryPendingEntries,
      clearResolvedPendingEntries,
      clearStaleFailedPendingEntries,
      ingestObservability,
    ],
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}
