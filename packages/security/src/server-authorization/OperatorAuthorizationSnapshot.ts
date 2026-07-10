import type { OperatorRole } from "../SecurityTypes";
import type { ServerPermission } from "./ServerPermission";

/** Snapshot seguro de autorização — sem tokens, emails ou service keys. */
export interface OperatorAuthorizationSnapshot {
  userId: string | null;
  profileId: string | null;
  role: OperatorRole | null;
  status: "active" | "invited" | "suspended" | null;
  active: boolean;
  permissions: ServerPermission[];
  canIngestAuditRemotely: boolean;
  resolvedFromProfile: boolean;
}
