"use client";

import { useEventBus } from "@douglas/events";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuditContext } from "./AuditContext";
import { createAuditMapperState, isAuditedEventTopic, mapEventToAuditEntries } from "./AuditEventMapper";
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
): CompositeAuditPersistenceAdapter {
  return createCompositeAuditPersistenceAdapter(integration?.supabaseClient ?? null, {
    mode: integration?.mode ?? "auto",
    isSupabaseConfigured: integration?.isSupabaseConfigured ?? false,
    localStorage: integration?.localStorage ?? legacyConfig,
    supabase: integration?.supabase,
  });
}

function createDefaultAuditLog(
  integration?: AuditPersistenceIntegrationConfig,
  legacyConfig?: Partial<AuditPersistenceConfig>,
): { log: AuditLog; adapter: CompositeAuditPersistenceAdapter } {
  const adapter = createPersistenceAdapter(integration, legacyConfig);
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
  const { subscribeAll } = useEventBus();
  const [{ log: defaultLog, adapter }] = useState(() =>
    externalAuditLog
      ? {
          log: externalAuditLog,
          adapter: createPersistenceAdapter(persistenceIntegration, persistenceConfig),
        }
      : createDefaultAuditLog(persistenceIntegration, persistenceConfig),
  );
  const auditLog = externalAuditLog ?? defaultLog;
  const [version, setVersion] = useState(0);
  const [persistenceStatus, setPersistenceStatus] = useState(
    readAuditPersistenceStatus(adapter) ?? DEFAULT_AUDIT_PERSISTENCE_STATUS,
  );
  const mapperStateRef = useRef(createAuditMapperState());
  const initializedRef = useRef(false);

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

  const value = useMemo(
    () => ({
      auditLog,
      entries,
      totalCount: auditLog.getCount(),
      persistenceStatus,
      retryPendingEntries,
    }),
    [auditLog, entries, persistenceStatus, retryPendingEntries],
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}
