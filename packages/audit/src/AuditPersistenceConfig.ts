export interface AuditPersistenceConfig {
  enabled: boolean;
  storageKey: string;
  maxEntries: number;
}

export const DEFAULT_AUDIT_PERSISTENCE_CONFIG: AuditPersistenceConfig = {
  enabled: true,
  storageKey: "douglas-ai-os:operational-audit",
  maxEntries: 200,
};
