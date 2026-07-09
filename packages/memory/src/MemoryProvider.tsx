"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { MemoryContext } from "./MemoryContext";
import { MemoryStore } from "./MemoryStore";
import { MemoryStoreRegistry } from "./MemoryStoreRegistry";
import type {
  MemoryBackendProvider,
  MemoryFilter,
  MemoryRecord,
  MemorySearchQuery,
  MemoryWriteInput,
} from "./MemoryTypes";

export interface MemoryProviderProps {
  children: ReactNode;
  backends: MemoryBackendProvider[];
  seedRecords?: MemoryRecord[];
  defaultBackendId?: string;
}

export function MemoryProvider({
  children,
  backends,
  seedRecords = [],
  defaultBackendId,
}: MemoryProviderProps) {
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const { store, registry } = useMemo(() => {
    const nextRegistry = new MemoryStoreRegistry();

    backends.forEach((backend, index) => {
      nextRegistry.createLocalBackend(
        backend,
        backend.id === defaultBackendId || (!defaultBackendId && index === 0),
      );
    });

    const nextStore = new MemoryStore(nextRegistry);

    if (seedRecords.length) {
      nextStore.seed(seedRecords);
    }

    return { store: nextStore, registry: nextRegistry };
  }, [backends, defaultBackendId, seedRecords]);

  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const records = useMemo(() => store.list(), [store, version]);
  const snapshot = useMemo(() => store.snapshot(), [store, version]);

  const activeRecord =
    records.find((record) => record.id === activeRecordId) ?? null;

  const write = useCallback(
    (input: MemoryWriteInput) => {
      const record = store.write(input);
      refresh();
      return record;
    },
    [refresh, store],
  );

  const read = useCallback(
    (recordId: string) => store.read(recordId),
    [store],
  );

  const update = useCallback(
    (recordId: string, patch: Partial<MemoryWriteInput>) => {
      const record = store.update(recordId, patch);
      refresh();
      return record;
    },
    [refresh, store],
  );

  const remove = useCallback(
    (recordId: string) => {
      const deleted = store.delete(recordId);
      refresh();
      return deleted;
    },
    [refresh, store],
  );

  const list = useCallback(
    (filter?: MemoryFilter) => store.list(filter),
    [store],
  );

  const search = useCallback(
    (query?: MemorySearchQuery) => store.search(query),
    [store],
  );

  const getHistory = useCallback(
    (recordId: string) => store.getHistoryByRecord(recordId),
    [store],
  );

  const getRecentHistory = useCallback(
    (limit?: number) => store.getRecentHistory(limit),
    [store],
  );

  const value = useMemo(
    () => ({
      store,
      registry,
      backends,
      records,
      snapshot,
      activeRecordId,
      activeRecord,
      selectRecord: setActiveRecordId,
      clearRecordSelection: () => setActiveRecordId(null),
      write,
      read,
      update,
      remove,
      list,
      search,
      getHistory,
      getRecentHistory,
    }),
    [
      activeRecord,
      activeRecordId,
      backends,
      getHistory,
      getRecentHistory,
      list,
      read,
      records,
      registry,
      remove,
      search,
      snapshot,
      store,
      update,
      write,
    ],
  );

  return (
    <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
  );
}
